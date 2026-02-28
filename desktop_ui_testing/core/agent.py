import time

from ..tasks.schema import Step, StepResult, ActionType
from .vision import VisionModel
from .screen import ScreenCapture
from .actions import ActionExecutor


class Agent:
    """
    Executes test steps by combining vision, screen capture, and actions.

    For vision-based steps (click, verify): screenshots the screen, asks the
    model to locate the target element, then performs the action.
    """

    def __init__(
        self,
        vision: VisionModel,
        screen: ScreenCapture,
        actions: ActionExecutor,
    ):
        self.vision = vision
        self.screen = screen
        self.actions = actions

    def execute_step(self, step: Step) -> StepResult:
        """Execute a single test step and return the result."""
        start = time.time()
        try:
            result = self._dispatch(step)
        except Exception as e:
            result = StepResult(step=step, passed=False, error=str(e))
        result.duration_seconds = time.time() - start
        return result

    def _dispatch(self, step: Step) -> StepResult:
        """Route a step to the appropriate handler."""
        if step.action == ActionType.WAIT:
            self.actions.wait(step.wait_seconds)
            return StepResult(step=step, passed=True)

        if step.action == ActionType.TYPE:
            self.actions.type_text(step.text)
            return StepResult(step=step, passed=True)

        if step.action == ActionType.PRESS_KEY:
            self.actions.press_key(step.key)
            return StepResult(step=step, passed=True)

        if step.action == ActionType.HOTKEY:
            self.actions.hotkey(*step.keys)
            return StepResult(step=step, passed=True)

        if step.action == ActionType.SCROLL:
            self.actions.scroll(step.scroll_amount)
            return StepResult(step=step, passed=True)

        if step.action == ActionType.VERIFY:
            return self._execute_verify(step)

        if step.action in (
            ActionType.CLICK, ActionType.DOUBLE_CLICK, ActionType.RIGHT_CLICK
        ):
            return self._execute_click(step)

        return StepResult(
            step=step, passed=False, error=f"Unknown action: {step.action}"
        )

    def _execute_click(self, step: Step) -> StepResult:
        """Find an element on screen and click it, with retries."""
        for attempt in range(step.retry_attempts):
            screenshot = self.screen.capture()
            result = self.vision.find_element(screenshot, step.target)
            coords = result["coordinates"]

            if coords is not None:
                px, py = self.screen.normalized_to_pixel(*coords)

                if step.action == ActionType.CLICK:
                    self.actions.click(px, py)
                elif step.action == ActionType.DOUBLE_CLICK:
                    self.actions.click(px, py, clicks=2)
                elif step.action == ActionType.RIGHT_CLICK:
                    self.actions.click(px, py, button="right")

                return StepResult(
                    step=step,
                    passed=True,
                    coordinates=(px, py),
                    model_response=result["raw_response"],
                )

            if attempt < step.retry_attempts - 1:
                print(
                    f"  Retry {attempt + 1}/{step.retry_attempts}: "
                    f"'{step.target}' not found, waiting {step.retry_delay}s..."
                )
                time.sleep(step.retry_delay)

        return StepResult(
            step=step,
            passed=False,
            error=f"Element '{step.target}' not found after {step.retry_attempts} attempts",
            model_response=result["raw_response"],
        )

    def _execute_verify(self, step: Step) -> StepResult:
        """
        Verify whether an element is visible on screen.

        Uses find_element (same as click) — if coordinates are returned,
        the element is considered visible.
        """
        for attempt in range(step.retry_attempts):
            screenshot = self.screen.capture()
            result = self.vision.find_element(screenshot, step.target)
            is_visible = result["coordinates"] is not None

            if is_visible == step.expected:
                return StepResult(
                    step=step,
                    passed=True,
                    model_response=result["raw_response"],
                )

            if attempt < step.retry_attempts - 1:
                print(
                    f"  Retry {attempt + 1}/{step.retry_attempts}: "
                    f"verification pending, waiting {step.retry_delay}s..."
                )
                time.sleep(step.retry_delay)

        expected_str = "visible" if step.expected else "not visible"
        return StepResult(
            step=step,
            passed=False,
            error=f"Expected '{step.target}' to be {expected_str}",
            model_response=result["raw_response"],
        )
