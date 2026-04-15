"""Click step -- click on a UI element or at explicit coordinates.

Supports click types: click (left), double_click, right_click, middle_click.
"""

from ._base import StepDefinition, FieldDef


def validate(step, step_num):
    if not step.target and step.click_x is None:
        return [f"Step {step_num}: 'click' requires a 'target' field or click_x/click_y coordinates"]
    if step.click_type not in ("click", "double_click", "right_click", "middle_click"):
        return [f"Step {step_num}: invalid click_type '{step.click_type}'"]
    return []


def execute(step, agent):
    click_type = step.click_type or "click"
    if step.click_x is not None and step.click_y is not None:
        return agent.click_at(step, click_type=click_type)
    return agent.find_and_click(step, click_type=click_type)


definition = StepDefinition(
    name="click",
    description="Click on a UI element or at coordinates (left, double, right, or middle click)",
    fields=[
        FieldDef("target", "string"),
        FieldDef("click_x", "number"),
        FieldDef("click_y", "number"),
        FieldDef("click_type", "string"),
    ],
    validate=validate,
    execute=execute,
)
