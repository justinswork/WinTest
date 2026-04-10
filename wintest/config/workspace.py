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
    """Initialize the workspace root. Call once at startup."""
    global _workspace_root
    if root:
        _workspace_root = Path(root).resolve()
    elif saved := _load_saved_root():
        _workspace_root = Path(saved).resolve()
    else:
        _workspace_root = Path.cwd()
    # Ensure key directories exist
    tests_dir().mkdir(parents=True, exist_ok=True)
    suites_dir().mkdir(parents=True, exist_ok=True)
    reports_dir().mkdir(parents=True, exist_ok=True)
    config_dir().mkdir(parents=True, exist_ok=True)


def set_root(new_root: str) -> None:
    """Change the workspace root and save the preference."""
    global _workspace_root
    _workspace_root = Path(new_root).resolve()
    _save_root(str(_workspace_root))
    # Ensure directories exist in the new workspace
    tests_dir().mkdir(parents=True, exist_ok=True)
    suites_dir().mkdir(parents=True, exist_ok=True)
    reports_dir().mkdir(parents=True, exist_ok=True)
    config_dir().mkdir(parents=True, exist_ok=True)


def root() -> Path:
    """Get the workspace root directory."""
    if _workspace_root is None:
        init()
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
