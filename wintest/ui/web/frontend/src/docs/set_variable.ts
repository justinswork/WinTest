import type { StepDoc } from './types';

export const setVariableDoc: StepDoc = {
  name: 'set_variable',
  title: 'Set Variable',
  summary: 'Set a variable value for use in subsequent steps.',
  description:
    'Sets or updates a named variable in the test run\'s variable store. The value can reference other variables using {{placeholder}} syntax. Variables set here can be used in any subsequent step\'s string fields (target, text, description, key, etc.).',
  parameters: [
    {
      name: 'variable_name',
      type: 'string',
      required: true,
      description: 'The name of the variable to set.',
    },
    {
      name: 'variable_value',
      type: 'string',
      required: true,
      description: 'The value to assign. Supports {{variable}} placeholders.',
    },
  ],
  example:
    '- action: set_variable\n  variable_name: "username"\n  variable_value: "admin"\n  description: "Set the username variable"',
};
