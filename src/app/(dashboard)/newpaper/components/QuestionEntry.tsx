'use client';

import { useState, useEffect, useRef } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Question, QuestionType, QuestionSplitup } from '@/types';
import { CheckCircle2, ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';

interface QuestionEntryProps {
  onValidChange: (valid: boolean) => void;
}

// The splitup object uses camelCase keys, but the actual QuestionType enum
// used everywhere else (DB, PDF/DOCX generation) is UPPER_SNAKE_CASE.
const SPLITUP_KEY_TO_TYPE: Record<keyof QuestionSplitup, QuestionType> = {
  mcq: 'MCQ',
  fillInBlanks: 'FILL_IN_BLANKS',
  matchTheFollowing: 'MATCH_THE_FOLLOWING',
  trueFalse: 'TRUE_FALSE',
  shortAnswer: 'SHORT_ANSWER',
  descriptive: 'DESCRIPTIVE',
  detailed: 'DETAILED',
  imageBased: 'IMAGE_BASED',
};

// A print-legible image at 150mm wide needs roughly this many pixels
// to stay within the 150-300 DPI range once printed.
const MIN_RECOMMENDED_WIDTH_PX = 400;

interface Slot {
  type: QuestionType;
  marksPerQuestion: number;
  count: number;
}

export default function QuestionEntry({ onValidChange }: QuestionEntryProps) {
  const { paper, addQuestion, removeQuestion } = usePaperStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');
  const [imageWarning, setImageWarning] = useState('');

  const getQuestionSlots = (): Slot[] => {
    const slots: Slot[] = [];
    (Object.entries(paper.questionSplitup) as [keyof QuestionSplitup, { count: number; marksPerQuestion: number }][]).forEach(
      ([key, value]) => {
        if (value.count > 0) {
          slots.push({
            type: SPLITUP_KEY_TO_TYPE[key],
            marksPerQuestion: value.marksPerQuestion,
            count: value.count,
          });
        }
      }
    );
    return slots;
  };

  const flattenSlots = (slots: Slot[]): Slot[] => {
    const flat: Slot[] = [];
    slots.forEach((slot) => {
      for (let i = 0; i < slot.count; i++) {
        flat.push(slot);
      }
    });
    return flat;
  };

  const questionSlots = flattenSlots(getQuestionSlots());
  const totalQuestions = questionSlots.length;
  const addedQuestions = paper.questions.length;
  const currentSlot = questionSlots[addedQuestions];

  const blankQuestion = (slot?: Slot): Partial<Question> => ({
    type: slot?.type || 'MCQ',
    text: '',
    options: ['', '', '', ''],
    answer: '',
    marks: slot?.marksPerQuestion ?? 1,
    imageUrl: undefined,
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>(blankQuestion(currentSlot));

  useEffect(() => {
    setCurrentQuestion(blankQuestion(currentSlot));
    setImageError('');
    setImageWarning('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedQuestions]);

  const canSubmit = !!currentQuestion.text && !!currentQuestion.answer;

  const handleAddQuestion = () => {
    if (!canSubmit) return;

    const newQuestion: Question = {
      type: currentQuestion.type || 'MCQ',
      text: currentQuestion.text!,
      options: currentQuestion.options,
      answer: currentQuestion.answer ?? '',
      marks: currentQuestion.marks || 1,
      order: paper.questions.length,
      imageUrl: currentQuestion.imageUrl,
    };
    addQuestion(newQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const options = [...((currentQuestion.options as string[]) || ['', '', '', ''])];
    options[index] = value;
    setCurrentQuestion({ ...currentQuestion, options });
  };

  const handleImageFile = (file: File) => {
    setImageError('');
    setImageWarning('');

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError('Image is too large. Please use a file under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < MIN_RECOMMENDED_WIDTH_PX) {
          setImageWarning(
            `This image is ${img.naturalWidth}\u00d7${img.naturalHeight}px \u2014 it may look blurry when printed. For best results, use an image at least ${MIN_RECOMMENDED_WIDTH_PX}px wide.`
          );
        }

        // Resize to fit within 400x600px (preserving aspect ratio, never upscaling)
        // so uploaded images have a consistent, print-appropriate resolution.
        const MAX_W = 400;
        const MAX_H = 600;
        const scale = Math.min(MAX_W / img.naturalWidth, MAX_H / img.naturalHeight, 1);
        const targetW = Math.round(img.naturalWidth * scale);
        const targetH = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Canvas unavailable for some reason - fall back to the original file.
          setCurrentQuestion((prev) => ({ ...prev, imageUrl: rawDataUrl }));
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCurrentQuestion((prev) => ({ ...prev, imageUrl: resizedDataUrl }));
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => setImageError('Could not read that file. Try again.');
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const allAdded = addedQuestions >= totalQuestions;
    onValidChange(allAdded && addedQuestions > 0);
  }, [addedQuestions, totalQuestions, onValidChange]);

  const renderImageAttachment = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Attach image (optional)
        </Label>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
        }}
      />
      {currentQuestion.imageUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={currentQuestion.imageUrl}
            alt="Question"
            className="max-h-40 rounded-md border border-border object-contain"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentQuestion((prev) => ({ ...prev, imageUrl: undefined }));
                setImageWarning('');
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Upload className="h-4 w-4" />
          {'Click to upload (max 4MB, 150\u2013300 DPI recommended)'}
        </button>
      )}
      {imageError && <p className="text-sm text-destructive">{imageError}</p>}
      {imageWarning && <p className="text-sm text-accent">{imageWarning}</p>}
    </div>
  );

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
              <Label>Correct answer</Label>
              <select
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={(currentQuestion.answer as string) || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
              >
                <option value="">Select correct option</option>
                {((currentQuestion.options as string[]) || []).map(
                  (opt, idx) =>
                    opt && (
                      <option key={idx} value={opt}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </option>
                    )
                )}
              </select>
            </div>
            {renderImageAttachment()}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-4">
            <div>
              <Label>Correct answer</Label>
              <select
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={(currentQuestion.answer as string) || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
              >
                <option value="">Select answer</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>
            {renderImageAttachment()}
          </div>
        );

      case 'MATCH_THE_FOLLOWING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Left column</Label>
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Item ${index + 1}`}
                    className="mt-2"
                    onChange={(e) => {
                      const currentMatch = (currentQuestion.answer as any) || { left: [], right: [] };
                      const left = [...(currentMatch.left || [])];
                      left[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, answer: { ...currentMatch, left } });
                    }}
                  />
                ))}
              </div>
              <div>
                <Label>Right column</Label>
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Match ${index + 1}`}
                    className="mt-2"
                    onChange={(e) => {
                      const currentMatch = (currentQuestion.answer as any) || { left: [], right: [] };
                      const right = [...(currentMatch.right || [])];
                      right[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, answer: { ...currentMatch, right } });
                    }}
                  />
                ))}
              </div>
            </div>
            {renderImageAttachment()}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Answer key</Label>
              <Input
                placeholder="Enter answer"
                value={(currentQuestion.answer as string) || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                className="mt-1.5"
              />
            </div>
            {renderImageAttachment()}
          </div>
        );
    }
  };

  const renderAddedQuestions = () =>
    paper.questions.map((q, index) => (
      <div key={index} className="mb-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                Q{index + 1}{' \u00b7 '}{q.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground">{q.marks} marks</span>
            </div>
            <p className="mt-2 text-sm">{q.text}</p>
            {q.imageUrl && (
              <img src={q.imageUrl} alt="" className="mt-2 max-h-32 rounded-md border border-border object-contain" />
            )}
            {q.options && Array.isArray(q.options) && q.options.length > 0 && (
              <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                {q.options.map(
                  (opt, idx) =>
                    opt && (
                      <div key={idx}>
                        {String.fromCharCode(65 + idx)}) {opt}
                      </div>
                    )
                )}
              </div>
            )}
            {q.answer ? (
              <p className="mt-2 text-sm text-success">
                Answer:{' '}
                {Array.isArray(q.answer)
                  ? q.answer.join(', ')
                  : typeof q.answer === 'object'
                  ? JSON.stringify(q.answer)
                  : String(q.answer)}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => removeQuestion(index)}
            className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    ));

  if (totalQuestions === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="font-display text-lg font-semibold text-accent">No question types configured</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please go back and set up your question split-up first.
        </p>
      </div>
    );
  }

  if (addedQuestions >= totalQuestions) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 py-12 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <p className="mt-3 font-display text-lg font-semibold">
          All {totalQuestions} questions have been added
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Review your paper before generating.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm">
          Adding questions for: <strong>{currentSlot?.type.replace(/_/g, ' ')}</strong>{' '}
          <span className="text-muted-foreground">({currentSlot?.marksPerQuestion} marks each)</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress: {addedQuestions} of {totalQuestions} questions added
        </p>
      </div>

      {renderAddedQuestions()}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Question text</Label>
            <Input
              placeholder="Enter question"
              value={currentQuestion.text || ''}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
              className="mt-1.5"
            />
          </div>

          {renderQuestionFields()}

          <Button className="w-full" onClick={handleAddQuestion} disabled={!canSubmit}>
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
