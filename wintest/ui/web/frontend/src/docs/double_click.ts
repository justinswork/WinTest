import type { StepDoc } from './types';

export const doubleClickDoc: StepDoc = {
  name: 'double_click',
  title: 'Double Click',
  summary: 'Double-click at captured coordinates, or on a UI element identified by AI.',
  description:
    'Works the same as click but performs a double-click. Useful for opening files, selecting words in text editors, or any interaction that requires a double-click. Supports coordinate mode (default, recorded by the Test Builder) and AI mode.',
  parameters: [
    {
      name: 'click_x',
      type: 'number',
      required: false,
      description: 'Normalized horizontal click coordinate (0.0–1.0).',
    },
    {
      name: 'click_y',
      type: 'number',
      required: false,
      description: 'Normalized vertical click coordinate (0.0–1.0).',
    },
    {
      name: 'target',
      type: 'string',
      required: false,
      description:
        'Natural language description for AI mode (only used if click_x/click_y are not set). Example: "the file icon named Report.docx".',
    },
  ],
  example:
    '- action: double_click\n  click_x: 0.35\n  click_y: 0.62\n  description: "Open the report file"',
};
