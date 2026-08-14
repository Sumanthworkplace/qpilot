'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkCalculator } from '@/lib/utils/markCalculator';
import { QuestionSplitup as SplitupType } from '@/types';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface QuestionSplitupProps {
  onValidChange: (valid: boolean) => void;
}

const questionTypes: { id: keyof SplitupType; label: string }[] = [
  { id: 'mcq', label: 'Multiple Choice Questions' },
  { id: 'fillInBlanks', label: 'Fill in the Blanks' },
  { id: 'matchTheFollowing', label: 'Match the Following' },
  { id: 'trueFalse', label: 'True or False' },
  { id: 'shortAnswer', label: 'Short Answers' },
  { id: 'descriptive', label: 'Descriptive Answers' },
  { id: 'detailed', label: 'Detailed Answers' },
];

export default function QuestionSplitup({ onValidChange }: QuestionSplitupProps) {
  const { paper, setQuestionSplitup } = usePaperStore();
  const [splitup, setSplitup] = useState<SplitupType>(paper.questionSplitup);
  const [totalMarks] = useState(paper.totalMarks);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    calculatedTotal: number;
    difference: number;
  }>({ isValid: false, calculatedTotal: 0, difference: 0 });

  const handleChange = (
    type: keyof SplitupType,
    field: 'count' | 'marksPerQuestion',
    value: string
  ) => {
    // Count must be a whole number of questions, but marks per question
    // can be fractional (e.g. 2.5) - parseInt would silently truncate that.
    const numValue = field === 'count' ? parseInt(value) || 0 : parseFloat(value) || 0;
    setSplitup((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: numValue,
      },
    }));
  };

  useEffect(() => {
    const result = MarkCalculator.validateMarks(splitup, totalMarks);
    setValidation(result);
    onValidChange(result.isValid && MarkCalculator.getTotalQuestions(splitup) > 0);

    if (result.isValid) {
      setQuestionSplitup(splitup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitup, totalMarks]);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm">
          Set the number of questions and marks for each question type. The total marks should
          equal <strong>{totalMarks}</strong>. Marks per question can include decimals (e.g. 2.5).
          Any question can optionally include an image \u2014 you&apos;ll get that option while
          adding questions.
        </p>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          validation.isValid ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">
              Total: {validation.calculatedTotal} / {totalMarks} marks
            </span>
          </div>
          {!validation.isValid ? (
            <span className="text-sm text-destructive">
              Difference: {validation.difference} marks{' '}
              {validation.difference > 0 ? 'remaining' : 'over'}
            </span>
          ) : (
            <span className="text-sm text-success">Perfect match</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {questionTypes.map((type) => {
          const data = splitup[type.id];
          return (
            <div key={type.id} className="rounded-lg border border-border bg-card p-4">
              <Label className="font-medium">{type.label}</Label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Count</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={data.count || ''}
                    onChange={(e) => handleChange(type.id, 'count', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Marks each</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={data.marksPerQuestion || ''}
                    onChange={(e) => handleChange(type.id, 'marksPerQuestion', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {data.count > 0 && data.marksPerQuestion > 0 && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {data.count} {'\u00d7'} {data.marksPerQuestion} = {Math.round(data.count * data.marksPerQuestion * 100) / 100} marks
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-display font-semibold">Summary</h4>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Total questions</span>
            <p className="font-mono font-medium">{MarkCalculator.getTotalQuestions(splitup)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total marks</span>
            <p className="font-mono font-medium">{validation.calculatedTotal}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className={`font-medium ${validation.isValid ? 'text-success' : 'text-destructive'}`}>
              {validation.isValid ? 'Valid' : 'Invalid'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Question types</span>
            <p className="font-mono font-medium">
              {Object.values(splitup).filter((v) => v.count > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
