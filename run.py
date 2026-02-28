import sys
import torch
from desktop_ui_testing.core.vision import VisionModel
from desktop_ui_testing.core.screen import ScreenCapture
from desktop_ui_testing.core.actions import ActionExecutor
from desktop_ui_testing.core.agent import Agent
from desktop_ui_testing.tasks.loader import load_task
from desktop_ui_testing.tasks.runner import TaskRunner

if __name__ == "__main__":
    # --- Load model ---
    vision = VisionModel()
    vision.load()

    screen = ScreenCapture()
    actions = ActionExecutor()

    print("Success! System Online.")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    else:
        print("GPU Name: None")

    # --- Task mode: run a YAML task file ---
    if len(sys.argv) > 1:
        task_file = sys.argv[1]
        print(f"\nLoading task: {task_file}")
        task = load_task(task_file)

        agent = Agent(vision, screen, actions)
        runner = TaskRunner(agent)
        result = runner.run(task)

        sys.exit(0 if result.passed else 1)

    # --- Demo mode: find a single element ---
    target = "Windows Start button"
    print(f"\nScanning screen for: '{target}'...")

    screenshot = screen.capture()
    result = vision.find_element(screenshot, target)

    print("-" * 30)
    print(f"TARGET: {target}")
    print(f"AI RESPONSE: {result['raw_response']}")

    if result["coordinates"]:
        x_norm, y_norm = result["coordinates"]
        px, py = screen.normalized_to_pixel(x_norm, y_norm)
        print(f"PARSED COORDS: [{x_norm}, {y_norm}] -> pixel ({px}, {py})")
    else:
        print("Could not parse coordinates from response.")
    print("-" * 30)
