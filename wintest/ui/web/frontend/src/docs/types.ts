export interface StepDoc {
  name: string;
  title: string;
  summary: string;
  description: string;
  parameters: StepParam[];
  example: string;
}

export interface StepParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}
