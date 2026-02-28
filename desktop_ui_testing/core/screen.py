import pyautogui
from PIL import Image


class ScreenCapture:
    """Handles screenshot capture and coordinate space conversion."""

    def __init__(self):
        self.screen_width, self.screen_height = pyautogui.size()

    def capture(self) -> Image.Image:
        """Take a screenshot of the primary display."""
        return pyautogui.screenshot()

    def normalized_to_pixel(
        self, x_norm: int, y_norm: int, scale: int = 1000
    ) -> tuple[int, int]:
        """
        Convert normalized coordinates (0-1000 scale) to actual pixel coordinates.

        Args:
            x_norm: X coordinate on 0-{scale} scale
            y_norm: Y coordinate on 0-{scale} scale
            scale: The normalization scale (default 1000)

        Returns:
            (pixel_x, pixel_y) tuple
        """
        px = int(x_norm / scale * self.screen_width)
        py = int(y_norm / scale * self.screen_height)
        return (px, py)
