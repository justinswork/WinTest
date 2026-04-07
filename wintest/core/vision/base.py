"""Base interface for vision models used in UI element grounding."""

from abc import ABC, abstractmethod
from PIL import Image


class BaseVisionModel(ABC):
    """Abstract base for all vision model implementations."""

    @abstractmethod
    def load(self) -> None:
        """Load the model into GPU memory."""

    @abstractmethod
    def find_element(self, screenshot: Image.Image, element_name: str) -> dict:
        """
        Find a UI element in a screenshot.

        Args:
            screenshot: PIL Image of the current screen.
            element_name: Natural language description of the element.

        Returns:
            dict with keys:
                "raw_response": str — the model's raw output text
                "coordinates": (x, y) | None — normalized 0-1000 coordinates
        """

    @staticmethod
    def coords_01_to_1000(x: float, y: float) -> tuple[int, int]:
        """Convert 0-1 scale coordinates to 0-1000 scale."""
        return (int(x * 1000), int(y * 1000))
