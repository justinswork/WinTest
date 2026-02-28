"""Service for task file CRUD operations."""

import os
from pathlib import Path

import yaml

from ....tasks.loader import load_task
from ....tasks.validator import validate_task
from ....tasks.schema import ActionType
from ..models import TaskModel, TaskListItem, StepModel, ValidationResult, ActionInfo

TASKS_DIR = "examples"


def list_tasks(settings=None) -> list[TaskListItem]:
    """List all task YAML files in the tasks directory."""
    tasks_dir = Path(TASKS_DIR)
    if not tasks_dir.exists():
        return []

    items = []
    for path in sorted(tasks_dir.glob("*.yaml")):
        try:
            task = load_task(str(path), settings=settings)
            items.append(TaskListItem(
                filename=path.name,
                name=task.name,
                step_count=len(task.steps),
            ))
        except (ValueError, Exception):
            items.append(TaskListItem(
                filename=path.name,
                name=f"(invalid: {path.name})",
                step_count=0,
            ))
    return items


def get_task(filename: str, settings=None) -> TaskModel:
    """Load a task file and return it as a TaskModel."""
    path = _resolve_path(filename)
    task = load_task(str(path), settings=settings)

    steps = []
    for step in task.steps:
        steps.append(StepModel(
            action=step.action.value,
            description=step.description,
            target=step.target,
            text=step.text,
            key=step.key,
            keys=step.keys,
            scroll_amount=step.scroll_amount,
            wait_seconds=step.wait_seconds,
            expected=step.expected,
            retry_attempts=step.retry_attempts,
            retry_delay=step.retry_delay,
            timeout=step.timeout,
        ))

    return TaskModel(
        name=task.name,
        filename=filename,
        application=task.application,
        steps=steps,
        settings=task.settings,
    )


def save_task(task: TaskModel, filename: str | None = None) -> str:
    """Save a TaskModel as a YAML file. Returns the filename."""
    if filename is None:
        filename = task.filename
    if filename is None:
        safe_name = task.name.lower().replace(" ", "_")
        filename = f"{safe_name}.yaml"

    data = {
        "name": task.name,
        "steps": [],
    }

    if task.application:
        data["application"] = task.application

    for step in task.steps:
        step_data = {"action": step.action}
        if step.description:
            step_data["description"] = step.description
        if step.target is not None:
            step_data["target"] = step.target
        if step.text is not None:
            step_data["text"] = step.text
        if step.key is not None:
            step_data["key"] = step.key
        if step.keys is not None:
            step_data["keys"] = step.keys
        if step.scroll_amount != 0:
            step_data["scroll_amount"] = step.scroll_amount
        if step.wait_seconds != 0.0:
            step_data["wait_seconds"] = step.wait_seconds
        if not step.expected:
            step_data["expected"] = step.expected
        if step.retry_attempts != 3:
            step_data["retry_attempts"] = step.retry_attempts
        if step.retry_delay != 2.0:
            step_data["retry_delay"] = step.retry_delay
        if step.timeout is not None:
            step_data["timeout"] = step.timeout
        data["steps"].append(step_data)

    if task.settings:
        data["settings"] = task.settings

    tasks_dir = Path(TASKS_DIR)
    tasks_dir.mkdir(exist_ok=True)
    path = tasks_dir / filename

    # Atomic write
    tmp_path = path.with_suffix(".yaml.tmp")
    with open(tmp_path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    os.replace(str(tmp_path), str(path))

    return filename


def delete_task(filename: str) -> None:
    """Delete a task file."""
    path = _resolve_path(filename)
    path.unlink()


def validate_task_file(filename: str, settings=None) -> ValidationResult:
    """Validate a task file structurally and semantically."""
    path = _resolve_path(filename)
    try:
        task = load_task(str(path), settings=settings)
    except ValueError as e:
        return ValidationResult(valid=False, issues=[str(e)])

    issues = validate_task(task)
    return ValidationResult(valid=len(issues) == 0, issues=issues)


def get_action_types() -> list[ActionInfo]:
    """Return all available action types with descriptions."""
    from ...cli import ACTION_DESCRIPTIONS, ACTION_REQUIRED_FIELDS

    actions = []
    for action in ActionType:
        actions.append(ActionInfo(
            name=action.value,
            description=ACTION_DESCRIPTIONS.get(action, ""),
            required_fields=ACTION_REQUIRED_FIELDS.get(action, []),
        ))
    return actions


def _resolve_path(filename: str) -> Path:
    """Resolve a filename to a path in the tasks directory."""
    path = Path(TASKS_DIR) / filename
    if not path.exists():
        raise FileNotFoundError(f"Task file not found: {filename}")
    return path
