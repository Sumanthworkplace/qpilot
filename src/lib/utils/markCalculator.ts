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