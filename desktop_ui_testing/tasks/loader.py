import yaml
from .schema import TaskDefinition, Step, ActionType


def load_task(filepath: str) -> TaskDefinition:
    """Load a task definition from a YAML file."""
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)

    if "name" not in data:
        raise ValueError(f"Task file {filepath} missing required 'name' field")
    if "steps" not in data or not data["steps"]:
        raise ValueError(f"Task file {filepath} missing or empty 'steps' field")

    settings = data.get("settings", {})
    default_retries = settings.get("retry_attempts", 3)
    default_retry_delay = settings.get("retry_delay", 2.0)

    steps = []
    for i, step_data in enumerate(data["steps"]):
        if "action" not in step_data:
            raise ValueError(f"Step {i + 1} missing required 'action' field")

        try:
            action = ActionType(step_data["action"])
        except ValueError:
            valid = [a.value for a in ActionType]
            raise ValueError(
                f"Step {i + 1}: unknown action '{step_data['action']}'. "
                f"Valid actions: {valid}"
            )

        steps.append(Step(
            action=action,
            description=step_data.get("description", ""),
            target=step_data.get("target"),
            text=step_data.get("text"),
            key=step_data.get("key"),
            keys=step_data.get("keys"),
            scroll_amount=step_data.get("scroll_amount", 0),
            wait_seconds=step_data.get("wait_seconds", 0.0),
            expected=step_data.get("expected", True),
            retry_attempts=step_data.get("retry_attempts", default_retries),
            retry_delay=step_data.get("retry_delay", default_retry_delay),
        ))

    return TaskDefinition(
        name=data["name"],
        steps=steps,
        application=data.get("application"),
        settings=settings,
    )
