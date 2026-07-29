export interface QuestionSplitup {
  mcq: { count: number; marksPerQuestion: number };
  fillInBlanks: { count: number; marksPerQuestion: number };
  matchTheFollowing: { count: number; marksPerQuestion: number };
  trueFalse: { count: number; marksPerQuestion: number };
  shortAnswer: { count: number; marksPerQuestion: number };
  descriptive: { count: number; marksPerQuestion: number };
  detailed: { count: number; marksPerQuestion: number };
}

export interface Question {
  id?: string;
  type: QuestionType;
  text: string;
  options?: string[] | { left: string[]; right: string[] };
  answer: string | string[] | { left: string; right: string }[];
  marks: number;
  order: number;
}

export interface Paper {
  id?: string;
  subject: string;
  totalMarks: number;
  totalHours: number;
  questions: Question[];
  questionSplitup: QuestionSplitup;
}

export type QuestionType = 
  | 'MCQ' 
  | 'FILL_IN_BLANKS' 
  | 'MATCH_THE_FOLLOWING' 
  | 'TRUE_FALSE' 
  | 'SHORT_ANSWER' 
  | 'DESCRIPTIVE' 
  | 'DETAILED';

export interface PaperResponse {
  id: string;
  subject: string;
  totalMarks: number;
  totalHours: number;
  questions: Question[];
  questionSplitup: QuestionSplitup;
  createdAt: string;
  updatedAt: string;
}