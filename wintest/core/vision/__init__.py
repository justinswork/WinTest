"""Vision model factory — select the right model based on settings."""

import logging

from .base import BaseVisionModel

logger = logging.getLogger(__name__)

# Map known model paths/names to their implementation
_MODEL_REGISTRY = {
    "showlab/ShowUI-2B": "showui",
}


def get_model(model_settings) -> BaseVisionModel:
    """Create a vision model instance based on model_settings.model_path."""
    model_path = model_settings.model_path

    # Check registry for known models
    impl = _MODEL_REGISTRY.get(model_path)

    if impl == "showui" or impl is None:
        # Default to ShowUI for unknown models (Qwen2-VL based)
        from .showui import ShowUIModel
        return ShowUIModel(model_settings)

    raise ValueError(f"Unknown vision model: {model_path}")


# Backwards compatibility: VisionModel alias
class VisionModel:
    """Factory wrapper for backwards compatibility.

    Code that does `VisionModel(settings)` will get the right model
    based on settings.model_path.
    """

    def __new__(cls, model_settings=None):
        if model_settings is None:
            from ...config.settings import ModelSettings
            model_settings = ModelSettings()
        return get_model(model_settings)
