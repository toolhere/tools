
export enum ToolCategory {
  PDF = 'PDF Tools',
  IMAGE = 'Image Tools',
  RESUME = 'Resume & Career AI',
  CONTENT = 'Content Creation',
  DEVELOPER = 'Developer Tools'
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
}

export interface ResumeAnalysisResult {
  score: number;
  atsCompatibility: string;
  feedback: string[];
  grammarClarity: string[];
  missingSections: string[];
  checklist: string[];
  skillGaps: string[];
}

export interface ContentIdea {
  title: string;
  hook: string;
  duration: string;
  angle: string;
}

export interface DevOutput {
  code: string;
  explanation: string;
  bestPractices: string[];
  edgeCases: string[];
}
