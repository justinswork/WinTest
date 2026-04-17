import type { StepDoc } from './types';

export const verifyScreenshotDoc: StepDoc = {
  name: 'verify_screenshot',
  title: 'Verify Screenshot',
  summary: 'Compare a region of the screen to a saved baseline image.',
  description:
    'Captures a screenshot, crops the specified region, and compares it to a baseline image saved earlier. Uses pixel-similarity with a configurable threshold so small rendering differences don\'t fail the step. Both the actual crop, the baseline, and a visual diff are saved with the test result when the step fails. Baselines are created from the Test Builder\'s region-selection tool.',
  parameters: [
    {
      name: 'region',
      type: 'number[4]',
      required: true,
      description:
        'Normalized coordinates of the region to capture, as [x1, y1, x2, y2] on a 0–1 scale.',
    },
    {
      name: 'baseline_id',
      type: 'string',
      required: true,
      description:
        'Filename of the baseline image in the workspace baselines/ directory.',
    },
    {
      name: 'similarity_threshold',
      type: 'number',
      required: false,
      description:
        'Minimum similarity (0.0–1.0) required to pass. Defaults to 0.90 (i.e. 90% similar).',
    },
  ],
  example:
    '- action: verify_screenshot\n  region: [0.05, 0.10, 0.40, 0.20]\n  baseline_id: "invoice_saved_toast.png"\n  similarity_threshold: 0.95\n  description: "Verify success toast is shown"',
};
