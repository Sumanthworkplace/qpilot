import { create } from 'zustand';
import { Paper, Question, QuestionSplitup, School } from '@/types';

interface PaperStore {
  paper: Paper;
  currentStep: number;
  isLoading: boolean;
  editingPaperId: string | null;
  setBasicDetails: (subject: string, totalMarks: number, totalHours: number) => void;
  setSchool: (school: School | null) => void;
  setQuestionSplitup: (splitup: QuestionSplitup) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (index: number, question: Question) => void;
  removeQuestion: (index: number) => void;
  resetPaper: () => void;
  loadPaperForEdit: (paper: Paper & { id: string }) => void;
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
  schoolId: null,
  school: null,
};

export const usePaperStore = create<PaperStore>((set, get) => ({
  paper: initialPaper,
  currentStep: 0,
  isLoading: false,
  editingPaperId: null,

  setBasicDetails: (subject, totalMarks, totalHours) =>
    set((state) => ({
      paper: { ...state.paper, subject, totalMarks, totalHours },
    })),

  setSchool: (school) =>
    set((state) => ({
      paper: { ...state.paper, school, schoolId: school?.id ?? null },
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

  resetPaper: () => set({ paper: initialPaper, currentStep: 0, editingPaperId: null }),

  loadPaperForEdit: (paper) =>
    set({ paper, currentStep: 0, editingPaperId: paper.id }),

  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

  previousStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
