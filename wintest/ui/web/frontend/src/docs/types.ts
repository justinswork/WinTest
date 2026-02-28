export interface ActionDoc {
  name: string;
  title: string;
  summary: string;
  description: string;
  parameters: ActionParam[];
  example: string;
}

export interface ActionParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}
