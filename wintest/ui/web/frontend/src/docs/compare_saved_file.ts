import type { StepDoc } from './types';

export const compareSavedFileDoc: StepDoc = {
  name: 'compare_saved_file',
  title: 'Compare Saved File',
  summary: 'Watch a directory for a new file and compare it to a baseline.',
  description:
    'Ideal for testing "save" or "export" workflows. At the start of the test, wintest snapshots the contents of file_path (treated as a directory). When this step runs, it waits for a new file to appear in that directory, then compares the new file to a baseline saved earlier in the workspace. Supports exact byte-for-byte comparison for deterministic outputs (JSON, text, binaries) and pixel-similarity for images.',
  parameters: [
    {
      name: 'file_path',
      type: 'string',
      required: true,
      description:
        'Directory to watch for a new file. Supports {{variable}} placeholders.',
    },
    {
      name: 'baseline_id',
      type: 'string',
      required: true,
      description:
        'Filename of the baseline in the workspace baselines/ directory to compare against.',
    },
    {
      name: 'compare_mode',
      type: 'string',
      required: false,
      description:
        '"exact" for byte-for-byte comparison (default) or "image" for pixel-similarity comparison of image files.',
    },
    {
      name: 'similarity_threshold',
      type: 'number',
      required: false,
      description:
        'For image mode: minimum similarity (0.0–1.0) required to pass. Defaults to 0.90.',
    },
  ],
  example:
    '- action: compare_saved_file\n  file_path: "C:\\\\Users\\\\demo\\\\Documents\\\\Invoices"\n  baseline_id: "expected_invoice.pdf"\n  compare_mode: exact\n  description: "Verify exported PDF matches baseline"',
};
