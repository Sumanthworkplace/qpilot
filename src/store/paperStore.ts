import { create } from 'zustand';
import { Paper, Question, QuestionSplitup } from '@/types';

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
  imageBased: { count: 0, marksPerQuestion: 0 },
};

const initialPaper: Paper = {
  subject: '',
  totalMarks: 0,
  totalHours: 0,
  questions: [],
  questionSplitup: initialSplitup,
};

export const usePaperStore = create<PaperStore>((set, get) => ({
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