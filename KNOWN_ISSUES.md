# Known Issues & Testing Feedback

Scratchpad of bugs, UX issues, and improvements identified during user testing.

## Cancel doesn't work on wait steps
Cancelling a running test while on a `wait` step doesn't interrupt the sleep. The wait step needs to check for cancellation during the sleep instead of blocking.

## "Add & Run" shouldn't be available for all steps
Many steps (wait, set_variable, loop, watch_directory, compare_new_file) don't benefit from being executed live. "Add & Run" should only be the primary action for steps that interact with the screen (click, type, launch_application). Other steps should default to "Add Step" only.

## Combine press_key and hotkey into a key recorder
Instead of typing key names like "up arrow" or "ctrl, c", the step should record actual keypresses — the user presses the key combo and it gets captured. Similar to recording a macro. Combine `press_key` and `hotkey` into a single `key` step type.

## "Add without running" icon should be plus, not checkmark
The dropdown "Add without running" option should use a plus icon instead of a checkmark.

## Combobox interactions are difficult in the builder
Clicking a combobox in the target app, then clicking back on wintest dismisses the combobox. Need a way to interact with comboboxes without switching focus. Possible solutions: hotkey-triggered screenshot capture, or auto-capture after each click without requiring the user to return to wintest.

## Tests should declare AI vs coordinate mode
Tests should specify upfront whether they use AI-based element finding or coordinate-based clicking. Coordinate-based tests should never attempt to load the AI model. This could be a test-level setting or inferred from the steps.

## Remove AI model status from dashboard
The AI model status card on the dashboard is misleading since AI-based clicking is not reliable. Remove or move it to a less prominent location until AI grounding improves.

## watch_directory + compare_new_file should be a single workflow
These two steps should feel like one operation. Either combine them into a single step that handles both watching and comparing, or make the UI clearly guide the user through the two-step process with visual indicators.

## Remove accept/retry for coordinate clicks
The confirm/retry flow only makes sense for AI-based clicks where the model might click the wrong thing. For coordinate clicks, the user already chose where to click — just execute and move on. Users can delete and redo if needed.

## Combine click, double_click, right_click into one step
Single `click` step type with a click-type selector (left, double, right, middle). Reduces the action dropdown clutter and is more intuitive.

## Execution viewer doesn't show step screenshots for completed steps
While a test is running, clicking on a previously completed step in the execution viewer should update the screenshot panel to show that step's screenshot with the crosshair annotation.
