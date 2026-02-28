import type { ActionDoc } from './types';

export const verifyDoc: ActionDoc = {
  name: 'verify',
  title: 'Verify',
  summary: 'Verify that a UI element is visible (or not visible).',
  description:
    'Takes a screenshot and asks the AI vision model whether the described element is present on screen. By default, the step passes if the element is found. Set "expected" to false to verify that an element is NOT visible.',
  parameters: [
    {
      name: 'target',
      type: 'string',
      required: true,
      description:
        'Natural language description of what to look for (e.g. "text containing \'Hello, World!\'", "a success message", "the login button").',
    },
  ],
  example:
    '- action: verify\n  target: "text containing \'Hello, World!\'"\n  description: "Verify the greeting text is shown"',
};
