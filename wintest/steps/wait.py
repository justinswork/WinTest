"""Wait step -- pause execution for a specified duration."""

import time

from ._base import StepDefinition, FieldDef
from ..tasks.schema import StepResult


def validate(step, step_num):
    if step.wait_seconds <= 0:
        return [f"Step {step_num}: 'wait' requires a positive 'wait_seconds' value"]
    return []


def execute(step, runner_ctx):
    """Sleep for step.wait_seconds, polling cancellation every 100ms so that
    a Cancel during a long wait takes effect within ~one tick."""
    progress_cb = runner_ctx.get("progress_callback")
    deadline = time.time() + step.wait_seconds
    while time.time() < deadline:
        if progress_cb and hasattr(progress_cb, "is_cancelled") and progress_cb.is_cancelled():
            break
        remaining = deadline - time.time()
        time.sleep(min(0.1, remaining))
    return StepResult(step=step, passed=True)


definition = StepDefinition(
    name="wait",
    description="Pause execution for a specified duration",
    fields=[FieldDef("wait_seconds", "number", required=True)],
    validate=validate,
    execute=execute,
    is_runner_step=True,
)
