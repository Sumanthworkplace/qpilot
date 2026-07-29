'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Question, QuestionType } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionEntryProps {
  onValidChange: (valid: boolean) => void;
}

export default function QuestionEntry({ onValidChange }: QuestionEntryProps) {
  const { paper, addQuestion, removeQuestion } = usePaperStore();
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'MCQ',
    text: '',
    options: ['', '', '', ''],
    answer: '',
    marks: 1,
  });

  const getQuestionSlots = () => {
    const slots: { type: QuestionType; count: number }[] = [];
    const { questionSplitup } = paper;
    
    Object.entries(questionSplitup).forEach(([key, value]) => {
      if (value.count > 0) {
        slots.push({ 
          type: key as QuestionType, 
          count: value.count 
        });
      }
    });
    
    return slots;
  };

  const questionSlots = getQuestionSlots();
  const totalQuestions = questionSlots.reduce((sum, slot) => sum + slot.count, 0);
  const addedQuestions = paper.questions.length;
  const currentQuestionType = questionSlots[addedQuestions]?.type;

  const handleAddQuestion = () => {
    if (currentQuestion.text && currentQuestion.answer) {
      const newQuestion: Question = {
        type: currentQuestion.type || 'MCQ',
        text: currentQuestion.text,
        options: currentQuestion.options || [],
        answer: currentQuestion.answer,
        marks: currentQuestion.marks || 1,
        order: paper.questions.length,
      };
      addQuestion(newQuestion);
      setCurrentQuestion({
        type: currentQuestionType || 'MCQ',
        text: '',
        options: ['', '', '', ''],
        answer: '',
        marks: 1,
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const options = [...(currentQuestion.options as string[] || ['', '', '', ''])];
    options[index] = value;
    setCurrentQuestion({ ...currentQuestion, options });
  };

  useEffect(() => {
    const allAdded = addedQuestions >= totalQuestions;
    onValidChange(allAdded && addedQuestions > 0);
  }, [addedQuestions, totalQuestions, onValidChange]);

  const renderQuestionFields = () => {
    const type = currentQuestion.type || 'MCQ';
    
    switch (type) {
      case 'MCQ':
        return (
          <div className="space-y-4">
            <div>
              <Label>Options (4 options required)</Label>
              {[0, 1, 2, 3].map((index) => (
                <Input
                  key={index}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={(currentQuestion.options as string[])?.[index] || ''}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="mt-2"
                />
              ))}
            </div>
            <div>
              <Label>Correct Answer</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentQuestion.answer as string || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
              >
                <option value="">Select correct option</option>
                {(currentQuestion.options as string[] || []).map((opt, idx) => (
                  opt && <option key={idx} value={opt}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      
      case 'TRUE_FALSE':
        return (
          <div>
            <Label>Correct Answer</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={currentQuestion.answer as string || ''}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
            >
              <option value="">Select answer</option>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        );
      
      case 'MATCH_THE_FOLLOWING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Left Column</Label>
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Item ${index + 1}`}
                    className="mt-2"
                    onChange={(e) => {
                      const currentMatch = currentQuestion.answer as any || { left: [], right: [] };
                      const left = [...(currentMatch.left || [])];
                      left[index] = e.target.value;
                      setCurrentQuestion({ 
                        ...currentQuestion, 
                        answer: { ...currentMatch, left } 
                      });
                    }}
                  />
                ))}
              </div>
              <div>
                <Label>Right Column</Label>
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Match ${index + 1}`}
                    className="mt-2"
                    onChange={(e) => {
                      const currentMatch = currentQuestion.answer as any || { left: [], right: [] };
                      const right = [...(currentMatch.right || [])];
                      right[index] = e.target.value;
                      setCurrentQuestion({ 
                        ...currentQuestion, 
                        answer: { ...currentMatch, right } 
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <Label>Answer Key</Label>
            <Input
              placeholder="Enter answer"
              value={currentQuestion.answer as string || ''}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
            />
          </div>
        );
    }
  };

  const renderAddedQuestions = () => {
    return paper.questions.map((q, index) => (
      <Card key={index} className="mb-4">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Q{index + 1} ({q.type})
                </span>
                <span className="text-sm text-gray-600">
                  [{q.marks} marks]
                </span>
              </div>
              <p className="mt-2">{q.text}</p>
              {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                <div className="mt-2 text-sm">
                  {q.options.map((opt, idx) => (
                    <div key={idx}>• {String.fromCharCode(65 + idx)}. {opt}</div>
                  ))}
                </div>
              )}
              {q.answer && (
                <div className="mt-2 text-sm text-green-600">
                  Answer: {Array.isArray(q.answer) ? q.answer.join(', ') : typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
  };

  if (addedQuestions >= totalQuestions && totalQuestions > 0) {
    return (
      <div className="text-center py-12">
        <div className="text-green-600 text-lg font-semibold">
          ✅ All {totalQuestions} questions have been added!
        </div>
        <p className="text-gray-600 mt-2">Review your paper before generating.</p>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-600 text-lg font-semibold">
          ⚠️ No question types configured
        </div>
        <p className="text-gray-600 mt-2">Please go back and set up your question split-up first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          Adding questions for: <strong>{currentQuestionType}</strong>
          <br />
          Progress: {addedQuestions} of {totalQuestions} questions added
        </p>
      </div>

      {renderAddedQuestions()}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Question Text</Label>
            <Input
              placeholder="Enter question"
              value={currentQuestion.text || ''}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
            />
          </div>

          {renderQuestionFields()}

          <Button
            className="w-full"
            onClick={handleAddQuestion}
            disabled={!currentQuestion.text || !currentQuestion.answer}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}