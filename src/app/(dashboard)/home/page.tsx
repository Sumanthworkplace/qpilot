'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, ListChecks, Plus, SlidersHorizontal } from 'lucide-react';

const actions = [
  {
    href: '/newpaper',
    icon: Plus,
    title: 'New paper',
    body: 'Set your marks and question mix, and build a fresh paper from scratch.',
    accent: true,
  },
  {
    href: '/my-papers',
    icon: FileText,
    title: 'My papers',
    body: 'Browse, reuse, or export papers you\u2019ve already built.',
    accent: false,
  },
];

const tips = [
  {
    icon: ListChecks,
    text: 'Mix question types freely \u2014 MCQ, short answer, descriptive, and more.',
  },
  {
    icon: SlidersHorizontal,
    text: 'QPilot checks your marks add up before you generate anything.',
  },
];

export default function DashboardHome() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          Dashboard
        </span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pick up where you left off, or start a new paper.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {actions.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Link
              href={action.href}
              className={`group flex h-full flex-col justify-between rounded-lg border p-6 transition-transform hover:-translate-y-0.5 ${
                action.accent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card'
              }`}
            >
              <div>
                <action.icon
                  className={`h-7 w-7 ${action.accent ? 'text-primary-foreground' : 'text-primary'}`}
                />
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {action.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    action.accent ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {action.body}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Go
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-10 rounded-lg border border-border bg-card/60 p-6"
      >
        <h2 className="font-display text-lg font-semibold">Good to know</h2>
        <ul className="mt-4 space-y-3">
          {tips.map((tip) => (
            <li key={tip.text} className="flex items-start gap-3 text-sm text-muted-foreground">
              <tip.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {tip.text}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
