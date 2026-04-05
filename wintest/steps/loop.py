"""Loop step -- jump back to an earlier step, repeating a range of steps."""

from ._base import StepDefinition, FieldDef
from ..tasks.schema import StepResult


def validate(step, step_num):
    issues = []
    if step.loop_target is None:
        issues.append(f"Step {step_num}: 'loop' requires a 'loop_target' field")
    elif step.loop_target < 1:
        issues.append(f"Step {step_num}: 'loop_target' must be >= 1")
    elif step.loop_target >= step_num:
        issues.append(f"Step {step_num}: 'loop_target' must point to an earlier step")
    if step.repeat < 1:
        issues.append(f"Step {step_num}: 'loop' requires a positive 'repeat' count")
    return issues


def execute(step, runner_ctx):
    """Execute in runner context to manipulate loop counters and step index."""
    loop_counters = runner_ctx["loop_counters"]
    step_index = runner_ctx["current_step_index"]

    # Initialize counter on first hit
    if step_index not in loop_counters:
        loop_counters[step_index] = 0

    loop_counters[step_index] += 1

    if loop_counters[step_index] <= step.repeat:
        iteration = loop_counters[step_index]
        # Set loop_index variable for use in subsequent steps
        variables = runner_ctx.get("variables")
        if variables:
            variables.set("loop_index", str(iteration))
        # Signal the runner to jump back
        runner_ctx["jump_to"] = step.loop_target - 1  # Convert to 0-indexed
        return StepResult(
            step=step, passed=True,
        )
    else:
        # Loop exhausted, reset counter and continue
        del loop_counters[step_index]
        return StepResult(step=step, passed=True)


definition = StepDefinition(
    name="loop",
    description="Jump back to an earlier step, repeating a range of steps N times",
    fields=[
        FieldDef("loop_target", "number", required=True),
        FieldDef("repeat", "number", required=True),
    ],
    validate=validate,
    execute=execute,
    is_runner_step=True,
)
