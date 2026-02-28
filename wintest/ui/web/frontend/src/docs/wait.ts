import type { ActionDoc } from './types';

export const waitDoc: ActionDoc = {
  name: 'wait',
  title: 'Wait',
  summary: 'Pause execution for a specified duration.',
  description:
    'Pauses the test execution for the specified number of seconds. Useful for waiting for animations to complete, pages to load, or applications to become responsive before proceeding to the next step.',
  parameters: [
    {
      name: 'wait_seconds',
      type: 'number',
      required: true,
      description:
        'Number of seconds to wait. Must be a positive value. Supports decimals (e.g. 0.5 for half a second).',
    },
  ],
  example:
    '- action: wait\n  wait_seconds: 2\n  description: "Wait for the page to load"',
};
