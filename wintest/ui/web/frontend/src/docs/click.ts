import type { StepDoc } from './types';

export const clickDoc: StepDoc = {
  name: 'click',
  title: 'Click',
  summary: 'Click at captured coordinates, or on a UI element identified by AI.',
  description:
    'Performs a click at a screen location. The click_type parameter selects single left, double, right, or middle click. There are two modes: coordinate-based (the default, set up by the Test Builder) uses pixel-exact coordinates recorded when you clicked on the screenshot; AI-based uses a vision model to locate an element described in plain language. Coordinate mode is faster and deterministic; AI mode is useful when a layout may shift between runs.',
  parameters: [
    {
      name: 'click_type',
      type: 'string',
      required: false,
      description:
        'One of "click" (left, default), "double_click", "right_click", or "middle_click".',
    },
    {
      name: 'click_x',
      type: 'number',
      required: false,
      description:
        'Normalized horizontal click coordinate (0.0–1.0). Used together with click_y for coordinate-based clicking. Typically recorded by the Test Builder.',
    },
    {
      name: 'click_y',
      type: 'number',
      required: false,
      description:
        'Normalized vertical click coordinate (0.0–1.0). Used together with click_x for coordinate-based clicking.',
    },
    {
      name: 'target',
      type: 'string',
      required: false,
      description:
        'Natural language description of the UI element to click (AI mode). Only used if click_x and click_y are not set. Example: "Save button", "File menu".',
    },
  ],
  example:
    '- action: click\n  click_type: double_click\n  click_x: 0.35\n  click_y: 0.62\n  description: "Open the report file"',
};
