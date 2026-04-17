import type { StepDoc } from './types';

export const rightClickDoc: StepDoc = {
  name: 'right_click',
  title: 'Right Click',
  summary: 'Right-click at captured coordinates, or on a UI element identified by AI.',
  description:
    'Performs a right-click (context menu click). Typically used to open context menus for additional options. Supports coordinate mode (default, recorded by the Test Builder) and AI mode.',
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
        'Natural language description for AI mode (only used if click_x/click_y are not set). Example: "the selected text".',
    },
  ],
  example:
    '- action: right_click\n  click_x: 0.55\n  click_y: 0.40\n  description: "Open context menu on selection"',
};
