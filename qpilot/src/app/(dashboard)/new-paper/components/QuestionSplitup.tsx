'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MarkCalculator } from '@/lib/utils/markCalculator';
import { QuestionSplitup as SplitupType } from '@/types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface QuestionSplitupProps {
  onValidChange: (valid: boolean) => void;
}

const questionTypes = [
  { id: 'mcq', label: 'Multiple Choice Questions', icon: '🔘' },
  { id: 'fillInBlanks', label: 'Fill in the Blanks', icon: '📝' },
  { id: 'matchTheFollowing', label: 'Match the Following', icon: '🔗' },
  { id: 'trueFalse', label: 'True or False', icon: '✓' },
  { id: 'shortAnswer', label: 'Short Answers', icon: '📄' },
  { id: 'descriptive', label: 'Descriptive Answers', icon: '📃' },
  { id: 'detailed', label: 'Detailed Answers', icon: '📑' },
];

export default function QuestionSplitup({ onValidChange }: QuestionSplitupProps) {
  const { paper, setQuestionSplitup } = usePaperStore();
  const [splitup, setSplitup] = useState<SplitupType>(paper.questionSplitup);
  const [totalMarks, setTotalMarks] = useState(paper.totalMarks);
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
    const numValue = parseInt(value) || 0;
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
    const hasQuestions = MarkCalculator.getTotalQuestions(splitup) > 0;
    onValidChange(result.isValid && hasQuestions);
    
    if (result.isValid) {
      setQuestionSplitup(splitup);
    }
  }, [splitup, totalMarks, onValidChange, setQuestionSplitup]);

  return (
    <div className="space-y-6 py-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          🎯 Set the number of questions and marks for each question type. 
          The total marks should equal <strong>{totalMarks}</strong>.
        </p>
      </div>

      <Card className={validation.isValid ? 'border-green-500' : 'border-red-500'}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Total: {validation.calculatedTotal} / {totalMarks} marks
              </span>
            </div>
            {!validation.isValid && (
              <span className="text-sm text-red-500">
                Difference: {validation.difference} marks {validation.difference > 0 ? 'remaining' : 'over'}
              </span>
            )}
            {validation.isValid && (
              <span className="text-sm text-green-500">✓ Perfect match!</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionTypes.map((type) => {
          const data = splitup[type.id as keyof SplitupType];
          return (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{type.icon}</span>
                  <Label className="font-medium">{type.label}</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Count</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.count || ''}
                      onChange={(e) =>
                        handleChange(type.id as keyof SplitupType, 'count', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Marks each</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={data.marksPerQuestion || ''}
                      onChange={(e) =>
                        handleChange(type.id as keyof SplitupType, 'marksPerQuestion', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                {data.count > 0 && data.marksPerQuestion > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Total: {data.count} × {data.marksPerQuestion} = {data.count * data.marksPerQuestion} marks
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Total Questions:</span>
              <span className="font-medium ml-2">{MarkCalculator.getTotalQuestions(splitup)}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Marks:</span>
              <span className="font-medium ml-2">{validation.calculatedTotal}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="font-medium ml-2 text-green-600">
                {validation.isValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Question Types:</span>
              <span className="font-medium ml-2">
                {Object.values(splitup).filter(v => v.count > 0).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
