'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePaperStore } from '@/store/paperStore';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileText, Loader2 } from 'lucide-react';
import BasicDetails from './components/BasicDetails';
import QuestionSplitup from './components/QuestionSplitup';
import QuestionEntry from './components/QuestionEntry';
import ReviewPaper from './components/ReviewPaper';

const steps = [
  { id: 0, title: 'Basic Details' },
  { id: 1, title: 'Question Split-up' },
  { id: 2, title: 'Enter Questions' },
  { id: 3, title: 'Review & Generate' },
];

function NewPaperContent() {
  const { currentStep, nextStep, previousStep, resetPaper, loadPaperForEdit, editingPaperId } =
    usePaperStore();
  const [isValid, setIsValid] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [loadError, setLoadError] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');

  useEffect(() => {
    setIsClient(true);

    if (editId) {
      setLoadingPaper(true);
      setLoadError('');
      fetch(`/api/papers/${editId}`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('Could not load that paper.');
          return res.json();
        })
        .then((paper) => {
          loadPaperForEdit(paper);
        })
        .catch(() => {
          setLoadError('Could not load that paper. It may have been deleted.');
        })
        .finally(() => setLoadingPaper(false));
    } else {
      resetPaper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  if (!isClient) {
    return null;
  }

  if (loadingPaper) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="font-mono text-sm">{'Loading paper\u2026'}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <button
          onClick={() => router.push('/my-papers')}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Back to My Papers
        </button>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicDetails onValidChange={setIsValid} />;
      case 1:
        return <QuestionSplitup onValidChange={setIsValid} />;
      case 2:
        return <QuestionEntry onValidChange={setIsValid} />;
      case 3:
        return <ReviewPaper />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {editingPaperId ? 'Edit Question Paper' : 'Create New Question Paper'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </p>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`mt-1 text-xs ${
                  index <= currentStep ? 'font-medium text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="min-h-[400px]">{renderStep()}</div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={previousStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        {currentStep < steps.length - 1 && (
          <button
            onClick={nextStep}
            disabled={!isValid}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NewPaperPage() {
  return (
    <Suspense fallback={null}>
      <NewPaperContent />
    </Suspense>
  );
}
