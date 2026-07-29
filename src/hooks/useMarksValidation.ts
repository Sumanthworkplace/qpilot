import { useMemo } from 'react';
import { QuestionSplitup } from '@/types';
import { MarkCalculator } from '@/lib/utils/markCalculator';

interface UseMarksValidationResult {
  isValid: boolean;
  calculatedTotal: number;
  difference: number;
  totalQuestions: number;
  breakdown: Record<string, number>;
}

export function useMarksValidation(
  splitup: QuestionSplitup,
  totalMarks: number
): UseMarksValidationResult {
  return useMemo(() => {
    const { isValid, calculatedTotal, difference } = MarkCalculator.validateMarks(
      splitup,
      totalMarks
    );
    const totalQuestions = MarkCalculator.getTotalQuestions(splitup);
    const breakdown = MarkCalculator.getMarksBreakdown(splitup);

    return { isValid, calculatedTotal, difference, totalQuestions, breakdown };
  }, [splitup, totalMarks]);
}