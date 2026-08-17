export interface QuestionSplitup {
  mcq: { count: number; marksPerQuestion: number };
  fillInBlanks: { count: number; marksPerQuestion: number };
  matchTheFollowing: { count: number; marksPerQuestion: number };
  trueFalse: { count: number; marksPerQuestion: number };
  shortAnswer: { count: number; marksPerQuestion: number };
  descriptive: { count: number; marksPerQuestion: number };
  detailed: { count: number; marksPerQuestion: number };
  imageBased: { count: number; marksPerQuestion: number };
}

export interface Question {
  id?: string;
  type: QuestionType;
  text: string;
  options?: string[] | { left: string[]; right: string[] };
  answer: string | string[] | { left: string; right: string }[];
  marks: number;
  order: number;
  imageUrl?: string;
}

export interface School {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface Paper {
  id?: string;
  title?: string;
  subject: string;
  className?: string;
  section?: string;
  totalMarks: number;
  totalHours: number;
  questions: Question[];
  questionSplitup: QuestionSplitup;
  schoolId?: string | null;
  school?: School | null;
}

export type QuestionType =
  | 'MCQ'
  | 'FILL_IN_BLANKS'
  | 'MATCH_THE_FOLLOWING'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'DESCRIPTIVE'
  | 'DETAILED'
  | 'IMAGE_BASED';

export interface PaperResponse {
  id: string;
  title?: string;
  subject: string;
  className?: string;
  section?: string;
  totalMarks: number;
  totalHours: number;
  questions: Question[];
  questionSplitup: QuestionSplitup;
  schoolId?: string | null;
  school?: School | null;
  createdAt: string;
  updatedAt: string;
}
