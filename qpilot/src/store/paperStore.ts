import { create } from 'zustand';

export interface QuestionSplitup {
  mcq: { count: number; marksPerQuestion: number };
  fillInBlanks: { count: number; marksPerQuestion: number };
  matchTheFollowing: { count: number; marksPerQuestion: number };
  trueFalse: { count: number; marksPerQuestion: number };
  shortAnswer: { count: number; marksPerQuestion: number };
  descriptive: { count: number; marksPerQuestion: number };
  detailed: { count: number; marksPerQuestion: number };
}

export type QuestionType = 
  | 'MCQ' 
  | 'FILL_IN_BLANKS' 
  | 'MATCH_THE_FOLLOWING' 
  | 'TRUE_FALSE' 
  | 'SHORT_ANSWER' 
  | 'DESCRIPTIVE' 
  | 'DETAILED';

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

interface PaperStore {
  paper: Paper;
  currentStep: number;
  isLoading: boolean;
  setBasicDetails: (subject: string, totalMarks: number, totalHours: number) => void;
  setQuestionSplitup: (splitup: QuestionSplitup) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (index: number, question: Question) => void;
  removeQuestion: (index: number) => void;
  resetPaper: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setLoading: (loading: boolean) => void;
}

const initialSplitup: QuestionSplitup = {
  mcq: { count: 0, marksPerQuestion: 0 },
  fillInBlanks: { count: 0, marksPerQuestion: 0 },
  matchTheFollowing: { count: 0, marksPerQuestion: 0 },
  trueFalse: { count: 0, marksPerQuestion: 0 },
  shortAnswer: { count: 0, marksPerQuestion: 0 },
  descriptive: { count: 0, marksPerQuestion: 0 },
  detailed: { count: 0, marksPerQuestion: 0 },
};

const initialPaper: Paper = {
  subject: '',
  totalMarks: 0,
  totalHours: 0,
  questions: [],
  questionSplitup: initialSplitup,
};

export const usePaperStore = create<PaperStore>((set) => ({
  paper: initialPaper,
  currentStep: 0,
  isLoading: false,
  
  setBasicDetails: (subject, totalMarks, totalHours) =>
    set((state) => ({
      paper: { ...state.paper, subject, totalMarks, totalHours },
    })),
    
  setQuestionSplitup: (splitup) =>
    set((state) => ({
      paper: { ...state.paper, questionSplitup: splitup },
    })),
    
  addQuestion: (question) =>
    set((state) => ({
      paper: {
        ...state.paper,
        questions: [...state.paper.questions, { ...question, order: state.paper.questions.length }],
      },
    })),
    
  updateQuestion: (index, question) =>
    set((state) => ({
      paper: {
        ...state.paper,
        questions: state.paper.questions.map((q, i) =>
          i === index ? { ...question, order: i } : q
        ),
      },
    })),
    
  removeQuestion: (index) =>
    set((state) => ({
      paper: {
        ...state.paper,
        questions: state.paper.questions.filter((_, i) => i !== index),
      },
    })),
    
  resetPaper: () => set({ paper: initialPaper, currentStep: 0 }),
  
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  
  previousStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));
