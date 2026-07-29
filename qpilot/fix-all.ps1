# fix-all.ps1
Write-Host "Creating missing files for QPilot..." -ForegroundColor Green

# Create store directory and file
New-Item -ItemType Directory -Force -Path "src\store" | Out-Null
@"
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
"@ | Out-File -FilePath "src\store\paperStore.ts" -Encoding UTF8

# Create types
New-Item -ItemType Directory -Force -Path "src\types" | Out-Null
@"
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
"@ | Out-File -FilePath "src\types\index.ts" -Encoding UTF8

# Create lib/utils
New-Item -ItemType Directory -Force -Path "src\lib\utils" | Out-Null
@"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
"@ | Out-File -FilePath "src\lib\utils\index.ts" -Encoding UTF8

# Create markCalculator
@"
import { QuestionSplitup } from '@/types';

export class MarkCalculator {
  static calculateTotalFromSplitup(splitup: QuestionSplitup): number {
    const totals = {
      mcq: splitup.mcq.count * splitup.mcq.marksPerQuestion,
      fillInBlanks: splitup.fillInBlanks.count * splitup.fillInBlanks.marksPerQuestion,
      matchTheFollowing: splitup.matchTheFollowing.count * splitup.matchTheFollowing.marksPerQuestion,
      trueFalse: splitup.trueFalse.count * splitup.trueFalse.marksPerQuestion,
      shortAnswer: splitup.shortAnswer.count * splitup.shortAnswer.marksPerQuestion,
      descriptive: splitup.descriptive.count * splitup.descriptive.marksPerQuestion,
      detailed: splitup.detailed.count * splitup.detailed.marksPerQuestion,
    };
    
    return Object.values(totals).reduce((sum, val) => sum + val, 0);
  }
  
  static validateMarks(splitup: QuestionSplitup, totalMarks: number): { 
    isValid: boolean; 
    calculatedTotal: number; 
    difference: number;
  } {
    const calculatedTotal = this.calculateTotalFromSplitup(splitup);
    return {
      isValid: calculatedTotal === totalMarks,
      calculatedTotal,
      difference: totalMarks - calculatedTotal,
    };
  }
  
  static getMarksBreakdown(splitup: QuestionSplitup): Record<string, number> {
    const breakdown: Record<string, number> = {};
    const types = {
      'MCQ': splitup.mcq,
      'Fill in the Blanks': splitup.fillInBlanks,
      'Match the Following': splitup.matchTheFollowing,
      'True/False': splitup.trueFalse,
      'Short Answers': splitup.shortAnswer,
      'Descriptive': splitup.descriptive,
      'Detailed': splitup.detailed,
    };
    
    Object.entries(types).forEach(([name, data]) => {
      if (data.count > 0) {
        breakdown[name] = data.count * data.marksPerQuestion;
      }
    });
    
    return breakdown;
  }
  
  static getTotalQuestions(splitup: QuestionSplitup): number {
    return Object.values(splitup).reduce((sum, val) => sum + val.count, 0);
  }
}
"@ | Out-File -FilePath "src\lib\utils\markCalculator.ts" -Encoding UTF8

Write-Host "✅ All files created successfully!" -ForegroundColor Green
Write-Host "Now run: npm run build" -ForegroundColor Yellow