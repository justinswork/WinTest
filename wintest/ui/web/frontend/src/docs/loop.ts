import type { StepDoc } from './types';

export const loopDoc: StepDoc = {
  name: 'loop',
  title: 'Loop',
  summary: 'Jump back to an earlier step, repeating a range of steps N times.',
  description:
    'When the runner reaches a loop step, it jumps back to the step specified by loop_target and re-executes all steps from there up to (and including) the loop step. This repeats for the number of times specified by repeat. Works like a do/while loop: the steps always run once before the loop step is reached, then repeat N more times. A {{loop_index}} variable is automatically set to the current iteration (1-based).',
  parameters: [
    {
      name: 'loop_target',
      type: 'number',
      required: true,
      description: 'The step number (1-indexed) to jump back to. Must point to an earlier step.',
    },
    {
      name: 'repeat',
      type: 'number',
      required: true,
      description: 'How many additional times to repeat the range of steps.',
    },
  ],
  example:
    '- action: click\n  target: "Next button"\n  description: "Click next"\n- action: wait\n  wait_seconds: 1\n- action: loop\n  loop_target: 1\n  repeat: 3\n  description: "Repeat click+wait 3 more times"',
};
