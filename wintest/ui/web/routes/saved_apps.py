"""Saved application paths — remembers frequently used executables."""

import json
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from ....config import workspace

router = APIRouter()


def _load() -> list[str]:
    path = workspace.saved_apps_file()
    if not path.exists():
        return []
    try:
        with open(path) as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _save(apps: list[str]) -> None:
    with open(workspace.saved_apps_file(), "w") as f:
        json.dump(apps, f, indent=2)


def add_app_path(app_path: str) -> None:
    """Add a path to the saved list (if not already present)."""
    apps = _load()
    if app_path and app_path not in apps:
        apps.append(app_path)
        _save(apps)


class AppPathRequest(BaseModel):
    path: str


@router.get("")
async def list_saved_apps():
    return _load()


@router.post("")
async def add_saved_app(request: AppPathRequest):
    add_app_path(request.path)
    return {"status": "added", "path": request.path}


@router.delete("")
async def remove_saved_app(request: AppPathRequest):
    apps = _load()
    apps = [a for a in apps if a != request.path]
    _save(apps)
    return {"status": "removed", "path": request.path}
