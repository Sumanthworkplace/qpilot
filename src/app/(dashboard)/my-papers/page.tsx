'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import { CheckSquare, Download, FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { PaperResponse } from '@/types';

type DownloadType = 'question_paper' | 'answer_key';

export default function MyPapersPage() {
  const [papers, setPapers] = useState<PaperResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  async function fetchPapers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/papers', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load papers');
      const data = await res.json();
      setPapers(data);
    } catch (err) {
      setError('Could not load your papers. Try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this paper? This can\u2019t be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Could not delete that paper. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(paper: PaperResponse, type: DownloadType) {
    const key = `${paper.id}:${type}`;
    setDownloadingKey(key);
    try {
      const res = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper, type }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const suffix = type === 'answer_key' ? ' - Answer Key' : '';
      saveAs(blob, `${paper.title || paper.subject}${suffix}.pdf`);
    } catch (err) {
      setError(
        type === 'answer_key' ? 'Could not generate the answer key. Try again.' : 'Could not generate the PDF. Try again.'
      );
    } finally {
      setDownloadingKey(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
            Library
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            My papers
          </h1>
          <p className="mt-2 text-muted-foreground">
            {'Every paper you\u2019ve built, saved to your account.'}
          </p>
        </div>
        <Link
          href="/newpaper"
          className="hidden items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex"
        >
          <Plus className="h-4 w-4" />
          New paper
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="font-mono text-sm">{'Loading your papers\u2026'}</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-display text-lg font-semibold">No papers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first question paper to get started.
          </p>
          <Link
            href="/newpaper"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create new paper
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {papers.map((paper, i) => {
              const pdfKey = `${paper.id}:question_paper`;
              const keyKey = `${paper.id}:answer_key`;
              return (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex flex-col justify-between rounded-lg border border-border bg-card p-5"
                >
                  <div>
                    <h3 className="font-display text-base font-semibold">
                      {paper.title || paper.subject}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {paper.subject} &middot; {paper.totalMarks} marks &middot; {paper.questions.length}{' '}
                      questions
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(paper.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(paper, 'question_paper')}
                        disabled={downloadingKey === pdfKey}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        {downloadingKey === pdfKey ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownload(paper, 'answer_key')}
                        disabled={downloadingKey === keyKey}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        {downloadingKey === keyKey ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckSquare className="h-3.5 w-3.5" />
                        )}
                        Answer key
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/newpaper?edit=${paper.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        disabled={deletingId === paper.id}
                        className="inline-flex items-center justify-center rounded-md border border-border p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        aria-label="Delete paper"
                      >
                        {deletingId === paper.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
