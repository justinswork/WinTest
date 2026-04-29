import type { StepDoc } from './types';

export const launchApplicationDoc: StepDoc = {
  name: 'launch_application',
  title: 'Launch Application',
  summary: 'Launch an application and manage its window.',
  description:
    'Starts an application from the given path and verifies that the launch succeeded. For direct .exe paths the runner spawns the process directly and fails the step if it exits during the wait period. When app_title is set, the runner also polls for a matching visible window — useful when the app forks/launches another process (e.g. a launcher .exe) or fails silently before opening any window. The matched window is reused for focus management and graceful close.',
  parameters: [
    {
      name: 'app_path',
      type: 'string',
      required: true,
      description:
        'Path to the application executable (e.g. "notepad.exe", "C:\\\\Program Files\\\\MyApp\\\\app.exe").',
    },
    {
      name: 'app_title',
      type: 'string',
      required: false,
      description:
        'Substring of the application window title to match (case-insensitive). Recommended: lets the runner verify the GUI window actually appeared, focus it before each step, and close it gracefully at the end of the test. Without it, verification is process-alive only.',
    },
    {
      name: 'wait_seconds',
      type: 'number',
      required: false,
      description:
        'Seconds to wait after launching for the application to become ready. Defaults to the global wait_after_launch setting.',
    },
  ],
  example:
    '- action: launch_application\n  app_path: "notepad.exe"\n  app_title: "Notepad"\n  wait_seconds: 3\n  description: "Launch Notepad"',
};
