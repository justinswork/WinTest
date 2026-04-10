"""Settings API routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from ....config import workspace
from .. import state as state_module

router = APIRouter()

AVAILABLE_MODELS = [
    {
        "id": "showlab/ShowUI-2B",
        "name": "ShowUI-2B",
        "description": "GUI-specialized click grounding model (recommended)",
        "size": "~4 GB",
    },
    {
        "id": "Qwen/Qwen2.5-VL-7B-Instruct",
        "name": "Qwen2.5-VL-7B",
        "description": "Larger general-purpose vision model with grounding support",
        "size": "~8 GB (4-bit)",
    },
    {
        "id": "Qwen/Qwen2.5-VL-3B-Instruct",
        "name": "Qwen2.5-VL-3B",
        "description": "Mid-size general-purpose vision model with grounding support",
        "size": "~4 GB (4-bit)",
    },
]


class ModelSettingRequest(BaseModel):
    model_path: str


class WorkspaceRequest(BaseModel):
    root: str


@router.get("/workspace")
async def get_workspace():
    """Get the current workspace configuration."""
    if not workspace.is_configured():
        return {"configured": False}
    return {
        "configured": True,
        "root": str(workspace.root()),
        "tests_dir": str(workspace.tests_dir()),
        "suites_dir": str(workspace.suites_dir()),
        "reports_dir": str(workspace.reports_dir()),
        "config_dir": str(workspace.config_dir()),
    }


@router.put("/workspace")
async def set_workspace(request: WorkspaceRequest):
    """Change the workspace root directory."""
    workspace.set_root(request.root)
    return {
        "root": str(workspace.root()),
        "tests_dir": str(workspace.tests_dir()),
        "suites_dir": str(workspace.suites_dir()),
        "reports_dir": str(workspace.reports_dir()),
        "config_dir": str(workspace.config_dir()),
    }


@router.get("/model")
async def get_model_setting():
    """Get the current model configuration."""
    app_state = state_module.app_state
    return {
        "model_path": app_state.settings.model.model_path,
        "model_status": app_state.model_status,
        "available_models": AVAILABLE_MODELS,
    }


@router.put("/model")
async def set_model_setting(request: ModelSettingRequest):
    """Change the vision model. Requires restart/reload to take effect."""
    app_state = state_module.app_state
    old_path = app_state.settings.model.model_path
    app_state.settings.model.model_path = request.model_path

    # If model is already loaded and we're switching, mark for reload
    if old_path != request.model_path and app_state.vision_model is not None:
        app_state.vision_model = None
        app_state.model_status = "not_loaded"

    return {
        "model_path": request.model_path,
        "model_status": app_state.model_status,
        "needs_reload": old_path != request.model_path,
    }
