'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, FileCheck, FileText, Loader2, Save } from 'lucide-react';
import { usePaperStore } from '@/store/paperStore';

export default function ReviewPaper() {
  const { paper, isLoading, setLoading, editingPaperId, resetPaper } = usePaperStore();
  const [generating, setGenerating] = useState<'question' | 'answer' | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = async (type: 'question_paper' | 'answer_key') => {
    setGenerating(type === 'question_paper' ? 'question' : 'answer');
    setError('');

    try {
      const response = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper: { ...paper, title: `${paper.subject} - Question Paper` },
          type,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Failed to generate PDF. Please try again.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${paper.subject}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const handleSavePaper = async () => {
    setLoading(true);
    setError('');
    try {
      const url = editingPaperId ? `/api/papers/${editingPaperId}` : '/api/papers';
      const method = editingPaperId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paper, title: paper.title || paper.subject }),
      });

      if (response.ok) {
        resetPaper();
        router.push('/my-papers');
      } else {
        const data = await response.json();
        setError(data.error ?? 'Failed to save paper');
      }
    } catch (err) {
      setError('Failed to save paper');
    } finally {
      setLoading(false);
    }
  };

  const questionsByType = paper.questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <p className="text-sm text-foreground">
          All {paper.questions.length} questions have been added. Review the summary below and
          generate your papers.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Paper summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <span className="text-muted-foreground">Subject</span>
              <span className="font-medium">{paper.subject}</span>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <span className="text-muted-foreground">Total marks</span>
              <span className="font-mono font-medium">{paper.totalMarks}</span>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <span className="text-muted-foreground">Total hours</span>
              <span className="font-mono font-medium">{paper.totalHours}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Total questions</span>
              <span className="font-mono font-medium">{paper.questions.length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Questions breakdown</h3>
          <div className="mt-3 space-y-1.5 text-sm">
            {Object.entries(questionsByType).length === 0 ? (
              <p className="text-muted-foreground">No questions added yet</p>
            ) : (
              Object.entries(questionsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">{type.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p className="text-sm text-foreground">
          {'Review all questions carefully before generating. Once generated, you can download both the question paper and answer key.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => handleGenerate('question_paper')}
          disabled={!!generating || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {generating === 'question' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
          Question paper
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => handleGenerate('answer_key')}
          disabled={!!generating || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-success px-4 py-3 text-sm font-semibold text-success-foreground disabled:opacity-60"
        >
          {generating === 'answer' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileCheck className="h-5 w-5" />
          )}
          Answer key
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={handleSavePaper}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-3 text-sm font-semibold text-primary disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {editingPaperId ? 'Update paper' : 'Save paper'}
        </motion.button>
      </div>
    </div>
  );
}
