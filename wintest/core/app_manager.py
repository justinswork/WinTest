import ctypes
import ctypes.wintypes
import logging
import os
import subprocess
import time
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

WM_CLOSE = 0x0010
SW_RESTORE = 9
SW_SHOWMAXIMIZED = 3


@dataclass
class AppConfig:
    """Application configuration, parsed from task YAML."""

    path: str
    title: Optional[str] = None
    wait_after_launch: float = 3.0
    process_name: Optional[str] = None

    def __post_init__(self):
        if self.process_name is None:
            self.process_name = self.path.replace("\\", "/").split("/")[-1]


def _get_window_process_id(user32, hwnd) -> int:
    """Get the process ID that owns the given window handle."""
    pid = ctypes.wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return pid.value


_PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
_STILL_ACTIVE = 259


def _is_pid_alive(pid: int) -> bool:
    """Return True if the given Windows PID refers to a running process."""
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(_PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not handle:
        return False
    try:
        exit_code = ctypes.wintypes.DWORD()
        if not kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code)):
            return False
        return exit_code.value == _STILL_ACTIVE
    finally:
        kernel32.CloseHandle(handle)


class ApplicationManager:
    """
    Manages the lifecycle of a desktop application under test.

    Handles launch, focus, running checks, graceful close, and force kill.
    Uses ctypes for all Win32 window operations.

    SAFETY: All window operations are scoped to the process that was launched.
    This prevents accidentally closing or interacting with other windows
    (e.g. VS Code, other editors) that happen to have a matching title.
    """

    def __init__(
        self,
        config: AppConfig,
        graceful_close_timeout: float = 5.0,
        focus_delay: float = 0.3,
        launch_timeout: float = 30.0,
    ):
        self.config = config
        self.graceful_close_timeout = graceful_close_timeout
        self.focus_delay = focus_delay
        self.launch_timeout = launch_timeout
        self._process: Optional[subprocess.Popen] = None
        self._gui_pid: Optional[int] = None
        self._launched_via_shell: bool = False
        self._user32 = ctypes.windll.user32

    @property
    def _pid(self) -> Optional[int]:
        """The PID of the GUI app under test, if known.

        Once launch verification finds a matching window we capture the GUI
        process's PID. Before then (or if no app_title is configured) we fall
        back to the spawned subprocess pid — which under shell=True is the
        cmd wrapper, not the GUI.
        """
        if self._gui_pid is not None:
            return self._gui_pid
        return self._process.pid if self._process else None

    def launch(self, kill_existing: bool = True) -> None:
        """Launch the application and verify it actually started.

        Raises:
            FileNotFoundError: app_path is an absolute path but the file
                does not exist on disk.
            RuntimeError: the cmd wrapper exited with an error, or the
                configured app_title window did not appear within
                launch_timeout.
        """
        if os.path.isabs(self.config.path) and not os.path.isfile(self.config.path):
            raise FileNotFoundError(
                f"Application not found: {self.config.path}"
            )

        if kill_existing and self.config.title and self.find_window_handle():
            logger.info("Closing existing '%s' windows...", self.config.title)
            self._close_matching_windows()
            time.sleep(1)

        # For direct .exe paths we spawn without a shell so Popen.pid is the
        # actual GUI process — that lets us verify launch by polling the
        # process even when no app_title is configured. For other paths (.bat,
        # PATH-resolved names, .lnk shortcuts) we fall back to shell=True.
        path = self.config.path
        use_shell = not (os.path.isfile(path) and path.lower().endswith(('.exe', '.com')))
        logger.info("Launching: %s", path)
        self._process = subprocess.Popen(
            path if use_shell else [path],
            shell=use_shell,
        )
        self._launched_via_shell = use_shell
        logger.info(
            "Waiting %.1fs for application to start (PID %d)...",
            self.config.wait_after_launch,
            self._process.pid,
        )
        time.sleep(self.config.wait_after_launch)

        self._verify_launched()

    def _verify_launched(self) -> None:
        """Confirm the launched app's process is alive (and optionally that
        its window appeared).

        When spawned without a shell (direct .exe path), Popen.pid is the GUI
        process itself: a non-None poll() means it exited during startup,
        which counts as a failed launch regardless of the exit code. When
        spawned via the shell, Popen.pid is the cmd wrapper which exits as
        soon as it has dispatched the GUI; only a non-zero exit signals a
        real failure (e.g. path not recognized).

        If app_title is configured we additionally poll for a matching
        window — this catches the case where the .exe started but silently
        terminated before opening any window.
        """
        if self._process is not None:
            rc = self._process.poll()
            if self._launched_via_shell:
                if rc is not None and rc != 0:
                    raise RuntimeError(
                        f"Failed to launch '{self.config.path}': "
                        f"shell exited with code {rc}"
                    )
            else:
                if rc is not None:
                    raise RuntimeError(
                        f"Failed to launch '{self.config.path}': "
                        f"process exited with code {rc} during startup"
                    )

        if not self.config.title:
            return

        deadline = time.time() + self.launch_timeout
        while time.time() < deadline:
            hwnd = self._find_window_by_title_any_process()
            if hwnd is not None:
                self._gui_pid = _get_window_process_id(self._user32, hwnd)
                logger.info(
                    "Application window '%s' found (PID %d).",
                    self.config.title, self._gui_pid,
                )
                return
            time.sleep(0.5)

        raise RuntimeError(
            f"Application window matching '{self.config.title}' did not appear "
            f"within {self.launch_timeout:.0f}s of launching '{self.config.path}'"
        )

    def focus(self) -> bool:
        """Bring the application window to the foreground and maximize it."""
        if not self.config.title:
            return False

        hwnd = self.find_window_handle()
        if hwnd:
            self._user32.ShowWindow(hwnd, SW_RESTORE)
            self._user32.ShowWindow(hwnd, SW_SHOWMAXIMIZED)
            self._user32.SetForegroundWindow(hwnd)
            time.sleep(self.focus_delay)
            return True

        logger.warning(
            "Could not find window matching '%s' to focus", self.config.title
        )
        return False

    def is_running(self) -> bool:
        """Check if the application process is still running."""
        if self._gui_pid is not None:
            return _is_pid_alive(self._gui_pid)
        if self._process is not None:
            return self._process.poll() is None
        if self.config.title:
            return self.find_window_handle() is not None
        return False

    def close(self) -> None:
        """Close gracefully (WM_CLOSE), falling back to force kill on timeout.

        Only targets windows owned by the launched process to avoid closing
        unrelated applications.
        """
        hwnd = self.find_window_handle() if self.config.title else None
        if hwnd:
            logger.info("Sending WM_CLOSE to '%s' (PID %s)...", self.config.title, self._pid)
            self._user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)

            deadline = time.time() + self.graceful_close_timeout
            while time.time() < deadline:
                if not self.find_window_handle():
                    logger.info("Application closed gracefully.")
                    return
                time.sleep(0.5)

            logger.warning("Graceful close timed out, force-killing...")

        self.force_close()

    def force_close(self) -> None:
        """Force-kill the launched GUI process by PID, or fall back to process name.

        Prefers the GUI PID captured at launch verification. If we never
        identified the GUI (no app_title configured, or verification skipped),
        falls back to the spawned subprocess pid — which under shell=True is
        the cmd wrapper and has likely already exited. Last resort is killing
        by process name.
        """
        pid = self._gui_pid
        if pid is not None:
            logger.info("Force-closing PID %d (%s)", pid, self.config.process_name)
            os.system(f"taskkill /PID {pid} /T /F >nul 2>&1")
            return
        if self._process is not None:
            logger.info("Force-closing PID %d (%s)", self._process.pid, self.config.process_name)
            os.system(f"taskkill /PID {self._process.pid} /T /F >nul 2>&1")
            return
        logger.info("Force-closing by name: %s", self.config.process_name)
        os.system(f"taskkill /IM {self.config.process_name} /F >nul 2>&1")

    def find_window_handle(self) -> Optional[int]:
        """Find the HWND of the first visible window matching the title.

        When a launched process PID is available, only windows belonging to
        that process are considered. This prevents matching unrelated windows
        (e.g. an editor with 'notepad' in the tab title).
        """
        return self._enum_windows_for_title(filter_pid=self._pid)

    def _find_window_by_title_any_process(self) -> Optional[int]:
        """Find a window matching the title without filtering by process.

        Used during launch verification: with shell=True, self._pid is the
        cmd.exe wrapper, not the GUI app, so the PID filter would never match.
        """
        return self._enum_windows_for_title(filter_pid=None)

    def _enum_windows_for_title(self, filter_pid: Optional[int]) -> Optional[int]:
        if not self.config.title:
            return None

        result = [None]
        title_lower = self.config.title.lower()

        @ctypes.WINFUNCTYPE(
            ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM
        )
        def callback(hwnd, _lparam):
            if not self._user32.IsWindowVisible(hwnd):
                return True
            if filter_pid is not None:
                window_pid = _get_window_process_id(self._user32, hwnd)
                if window_pid != filter_pid:
                    return True
            length = self._user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buf = ctypes.create_unicode_buffer(length + 1)
                self._user32.GetWindowTextW(hwnd, buf, length + 1)
                if title_lower in buf.value.lower():
                    result[0] = hwnd
                    return False
            return True

        self._user32.EnumWindows(callback, 0)
        return result[0]

    def get_foreground_window_title(self) -> Optional[str]:
        """Return the title of the current foreground window."""
        hwnd = self._user32.GetForegroundWindow()
        if not hwnd:
            return None
        length = self._user32.GetWindowTextLengthW(hwnd)
        if length == 0:
            return None
        buf = ctypes.create_unicode_buffer(length + 1)
        self._user32.GetWindowTextW(hwnd, buf, length + 1)
        return buf.value

    def _close_matching_windows(self) -> None:
        """Close all visible windows matching the title (used before launch).

        This is only called before launch to clean up pre-existing instances,
        so it does NOT filter by PID.
        """
        logger.info("Force-closing by name: %s", self.config.process_name)
        os.system(f"taskkill /IM {self.config.process_name} /F >nul 2>&1")
