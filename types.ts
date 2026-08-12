export interface PredictorTask {
  id: string;
  topic: string;
  title: string;
  description: string;
  codeSnippet: string;
  expectedOutput: string;
  hint?: string;
}