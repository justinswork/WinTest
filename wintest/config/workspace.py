"""Centralized workspace path management.

All user data paths (tests, suites, reports, config) go through this module.
The workspace root is configurable — default is the current working directory.
"""

import json
import os
from pathlib import Path

_workspace_root: Path | None = None

# Stored next to the executable / project root — not inside the workspace
_WORKSPACE_PREFS_FILE = "wintest_workspace.json"


def _load_saved_root() -> str | None:
    """Load the workspace root from the preferences file, if it exists."""
    try:
        with open(_WORKSPACE_PREFS_FILE) as f:
            data = json.load(f)
        return data.get("workspace_root")
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _save_root(root: str) -> None:
    """Save the workspace root to the preferences file."""
    with open(_WORKSPACE_PREFS_FILE, "w") as f:
        json.dump({"workspace_root": root}, f, indent=2)


def init(root: str | None = None) -> None:
    """Initialize the workspace root. Call once at startup.

    If no root is provided and none is saved, workspace stays unset.
    Services should check is_configured() before using paths.
    """
    global _workspace_root
    if root:
        _workspace_root = Path(root).resolve()
        _ensure_dirs()
    elif saved := _load_saved_root():
        _workspace_root = Path(saved).resolve()
        _ensure_dirs()
    else:
        _workspace_root = None


def _ensure_dirs() -> None:
    """Create workspace subdirectories if they don't exist."""
    if _workspace_root is None:
        return
    tests_dir().mkdir(parents=True, exist_ok=True)
    suites_dir().mkdir(parents=True, exist_ok=True)
    reports_dir().mkdir(parents=True, exist_ok=True)
    config_dir().mkdir(parents=True, exist_ok=True)


def is_configured() -> bool:
    """Check if a workspace has been configured."""
    return _workspace_root is not None


def set_root(new_root: str) -> None:
    """Change the workspace root and save the preference."""
    global _workspace_root
    _workspace_root = Path(new_root).resolve()
    _save_root(str(_workspace_root))
    _ensure_dirs()


def root() -> Path:
    """Get the workspace root directory. Raises if not configured."""
    if _workspace_root is None:
        raise RuntimeError("Workspace not configured. Set a workspace directory in Settings.")
    return _workspace_root


def config_dir() -> Path:
    return root() / "config"


def config_file() -> Path:
    return config_dir() / "config.yaml"


def saved_apps_file() -> Path:
    return config_dir() / "saved_apps.json"


def tests_dir() -> Path:
    return root() / "tests"


def suites_dir() -> Path:
    return root() / "test_suites"


def reports_dir() -> Path:
    return root() / "reports"
