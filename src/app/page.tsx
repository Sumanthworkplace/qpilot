'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  ListChecks,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

const heroQuestions = [
  { q: 'State Newton\u2019s second law of motion.', marks: 2 },
  { q: 'A ball is thrown vertically upward at 20 m/s. Find the time to reach maximum height.', marks: 5 },
  { q: 'Match the following physical quantities to their SI units.', marks: 4 },
];

const sections = [
  {
    label: 'Section A',
    title: 'Set the basics',
    body: 'Name the paper, pick the subject, and set the total marks and duration. QPilot uses these to keep everything else in check.',
  },
  {
    label: 'Section B',
    title: 'Choose your mix',
    body: 'Pick how many MCQs, short answers, or descriptive questions you want. QPilot validates the marks add up before you move on.',
  },
  {
    label: 'Section C',
    title: 'Generate & export',
    body: 'Download a formatted PDF or Word file, paginated and ready to print \u2014 plus a separate answer key for grading.',
  },
];

const features = [
  {
    icon: ListChecks,
    title: 'Seven question types',
    body: 'MCQ, fill in the blanks, match the following, true/false, short answer, descriptive, and detailed \u2014 mix and match freely.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Automatic mark validation',
    body: 'QPilot checks your question mix against the total marks in real time, before you generate anything.',
  },
  {
    icon: FileText,
    title: 'PDF and Word export',
    body: 'Every paper exports as a styled, print-ready PDF or a fully editable Word document.',
  },
  {
    icon: CheckCircle2,
    title: 'Answer key included',
    body: 'A matching answer key is generated alongside every paper, formatted for quick grading.',
  },
  {
    icon: FolderOpen,
    title: 'Your paper library',
    body: 'Every paper you build is saved to your account \u2014 reuse last term\u2019s paper or start fresh.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Your question papers are tied to your account only. Nothing is shared or indexed.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">
            QPilot
          </span>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            For teachers &amp; exam setters
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Question papers,
            <br />
            done in{' '}
            <span className="relative inline-block">
              minutes
              <span className="absolute inset-x-0 bottom-1 h-3 origin-left scale-x-0 animate-underline-draw bg-accent/60 [animation-delay:0.6s]" />
            </span>
            {' '}not evenings.
          </h1>

          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Set your marks and question mix, and QPilot assembles a fully
            formatted paper and answer key{' \u2014 '}ready to print or send.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start building{' \u2014 it\u2019s free'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Signature: self-assembling exam paper card */}
        <div className="relative flex justify-center">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
            className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="mb-4 flex items-center justify-between border-b border-border pb-3"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  Physics{' \u2014 '}Mid Term
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  100 marks &middot; 3 hrs
                </p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </motion.div>

            <div className="space-y-4 rule-line">
              {heroQuestions.map((item, i) => (
                <motion.div
                  key={item.q}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <p className="text-foreground">
                    <span className="font-mono text-muted-foreground">
                      Q{i + 1}.
                    </span>{' '}
                    {item.q}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {item.marks}m
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -18 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ delay: 0.9, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -right-4 -top-4 flex items-center gap-1.5 rounded-md border-2 border-success bg-background px-3 py-1.5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wide text-success">
                Paper ready
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works: Section A / B / C */}
      <section id="how-it-works" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-semibold tracking-tight"
          >
            Three sections. One paper.
          </motion.h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {sections.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-6"
              >
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
                  {s.label}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl font-semibold tracking-tight"
        >
          Everything a paper needs
        </motion.h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
              className="rounded-lg border border-border bg-card p-6"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-base font-semibold">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <h2 className="font-display text-2xl font-semibold text-primary-foreground sm:text-3xl">
            Your next paper is a few clicks away.
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          <p>QPilot{' \u2014 '}question papers, built properly.</p>
        </div>
      </footer>
    </div>
  );
}
