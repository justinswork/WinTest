import type { ActionDoc } from './types';

export const typeDoc: ActionDoc = {
  name: 'type',
  title: 'Type',
  summary: 'Type text at the current cursor position.',
  description:
    'Types the specified text string at whatever input currently has keyboard focus. Does not click or focus any element first — combine with a click step if you need to focus a specific field before typing.',
  parameters: [
    {
      name: 'text',
      type: 'string',
      required: true,
      description: 'The text to type (e.g. "Hello, World!", "user@example.com").',
    },
  ],
  example:
    '- action: type\n  text: "Hello, World!"\n  description: "Type greeting text"',
};
