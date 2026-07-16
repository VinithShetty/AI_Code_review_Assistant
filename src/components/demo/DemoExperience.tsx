'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  ExternalLink,
  FileCode2,
  Github,
  GitPullRequest,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Finding = {
  id: string;
  severity: 'Critical' | 'High' | 'Medium';
  category: string;
  title: string;
  description: string;
  suggestion: string;
  file: string;
  line: number;
  tone: string;
  dot: string;
  code: Array<{ number: number; content: string; kind?: 'focus' }>;
};

const findings: Finding[] = [
  {
    id: 'sql-injection',
    severity: 'Critical',
    category: 'Security',
    title: 'SQL injection through string interpolation',
    description:
      'The account identifier is concatenated directly into the query. An attacker could alter the SQL statement and access records outside their account.',
    suggestion:
      'Use a parameterized query so the database treats accountId as data rather than executable SQL.',
    file: 'src/services/transactions.ts',
    line: 42,
    tone: 'border-red-500/30 bg-red-500/10 text-red-300',
    dot: 'bg-red-400',
    code: [
      { number: 39, content: 'export async function getTransactions(accountId: string) {' },
      { number: 40, content: '  const db = await connectDatabase();' },
      { number: 41, content: '' },
      { number: 42, content: '  const query = `SELECT * FROM transactions WHERE account_id = ${accountId}`;', kind: 'focus' },
      { number: 43, content: '  return db.execute(query);' },
      { number: 44, content: '}' },
    ],
  },
  {
    id: 'exposed-secret',
    severity: 'High',
    category: 'Secrets',
    title: 'Payment API key committed to source',
    description:
      'A production-shaped credential is embedded in application code. Anyone with repository or bundle access could reuse it.',
    suggestion:
      'Rotate the exposed credential immediately and read the replacement from a server-only environment variable.',
    file: 'src/config/payments.ts',
    line: 8,
    tone: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    dot: 'bg-orange-400',
    code: [
      { number: 5, content: 'export const paymentConfig = {' },
      { number: 6, content: "  provider: 'stripe'," },
      { number: 7, content: "  mode: 'live'," },
      { number: 8, content: "  secretKey: 'hardcoded-production-token',", kind: 'focus' },
      { number: 9, content: '  retries: 3,' },
      { number: 10, content: '};' },
    ],
  },
  {
    id: 'missing-await',
    severity: 'Medium',
    category: 'Reliability',
    title: 'Async audit event is not awaited',
    description:
      'The request can complete before the audit write finishes. Failures become unhandled and important payment events may be lost.',
    suggestion:
      'Await the audit operation or intentionally queue it through a durable background job with retry handling.',
    file: 'src/app/api/payments/route.ts',
    line: 67,
    tone: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    dot: 'bg-yellow-300',
    code: [
      { number: 64, content: 'const payment = await createPayment(payload);' },
      { number: 65, content: '' },
      { number: 66, content: '// Record the event for compliance reporting' },
      { number: 67, content: "writeAuditEvent('payment.created', payment);", kind: 'focus' },
      { number: 68, content: '' },
      { number: 69, content: 'return Response.json(payment, { status: 201 });' },
    ],
  },
];

const workflow = [
  { icon: Github, label: 'Connect GitHub', detail: 'OAuth with repository access' },
  { icon: GitPullRequest, label: 'Select a pull request', detail: 'Fetch changed files and patches' },
  { icon: Bot, label: 'Run AI analysis', detail: 'Security, logic and reliability checks' },
  { icon: CheckCircle2, label: 'Act on findings', detail: 'Prioritized fixes with context' },
];

export default function DemoExperience() {
  const [selectedId, setSelectedId] = useState(findings[0].id);
  const selected = findings.find((finding) => finding.id === selectedId) ?? findings[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-20 h-80 w-80 rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute right-[8%] top-[36%] h-96 w-96 rounded-full bg-teal-500/7 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <header className="relative z-20 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image src="/codereview-logo.png" alt="CodeReview AI" width={38} height={38} className="rounded-lg" priority />
            <span className="text-base font-bold tracking-tight sm:text-lg">
              Code<span className="text-emerald-400">Review</span> AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-muted-foreground sm:inline-flex">
              <Link href="/"><ArrowLeft className="h-4 w-4" />Back home</Link>
            </Button>
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href="/login">Try it free<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />Interactive product demo
          </Badge>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            From pull request to <span className="text-emerald-400">actionable review</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Explore a guided sample review. Select a finding to see the exact code, reasoning,
            and remediation CodeReview AI gives your team.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Sample data for demonstration—no GitHub account required
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-card/70 shadow-2xl shadow-black/30 backdrop-blur"
        >
          <div className="flex flex-col gap-4 border-b border-white/8 bg-white/[0.025] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">FinFlow / improve payment validation</span>
                  <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300">PR #42</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">vinith/feature/payment-validation → main · 3 files changed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Review time</p>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-sm font-medium">
                  <Clock3 className="h-3.5 w-3.5 text-emerald-400" />18 seconds
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-center">
                <p className="text-lg font-bold text-orange-300">78</p>
                <p className="text-[10px] uppercase tracking-wider text-orange-300/70">Risk</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b border-white/8 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Prioritized findings</p>
                  <p className="mt-1 text-xs text-muted-foreground">3 issues need attention</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />Analysis complete
                </div>
              </div>

              <div className="space-y-2.5">
                {findings.map((finding, index) => {
                  const active = finding.id === selected.id;
                  return (
                    <button
                      key={finding.id}
                      type="button"
                      onClick={() => setSelectedId(finding.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        active
                          ? 'border-emerald-500/35 bg-emerald-500/8 shadow-lg shadow-emerald-950/20'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                      }`}
                      aria-pressed={active}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-muted-foreground">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${finding.dot}`} />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {finding.severity} · {finding.category}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-medium leading-5">{finding.title}</p>
                          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{finding.file}:{finding.line}</p>
                        </div>
                        <ChevronRight className={`mt-1 h-4 w-4 shrink-0 transition-transform ${active ? 'translate-x-0.5 text-emerald-400' : 'text-muted-foreground/50'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/8 pt-5 text-center">
                <div><p className="text-lg font-semibold text-red-300">1</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</p></div>
                <div><p className="text-lg font-semibold text-orange-300">1</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">High</p></div>
                <div><p className="text-lg font-semibold text-yellow-200">1</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Medium</p></div>
              </div>
            </aside>

            <div className="min-w-0 p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={selected.tone}>
                          <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />{selected.severity}
                        </Badge>
                        <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-muted-foreground">{selected.category}</Badge>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{selected.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{selected.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 font-mono text-xs text-muted-foreground">
                      <FileCode2 className="h-3.5 w-3.5 text-emerald-400" />Line {selected.line}
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#090c0d]">
                    <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
                        <FileCode2 className="h-3.5 w-3.5 text-emerald-400" /><span className="truncate">{selected.file}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">TypeScript</span>
                    </div>
                    <div className="overflow-x-auto py-3 font-mono text-[12px] leading-7 sm:text-[13px]">
                      {selected.code.map((line) => (
                        <div
                          key={`${selected.id}-${line.number}`}
                          className={`grid min-w-[680px] grid-cols-[52px_1fr] px-3 ${
                            line.kind === 'focus'
                              ? 'border-l-2 border-red-400 bg-red-500/10 text-red-100'
                              : 'border-l-2 border-transparent text-zinc-300'
                          }`}
                        >
                          <span className="select-none pr-4 text-right text-zinc-600">{line.number}</span>
                          <code className="whitespace-pre">{line.content || ' '}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
                    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 text-left">
                      <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-orange-300" />Why it matters</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.description}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-left">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><WandSparkles className="h-4 w-4" />Suggested fix</div>
                      <p className="mt-2 text-sm leading-6 text-emerald-50/75">{selected.suggestion}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-y border-white/8 bg-white/[0.018]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-muted-foreground">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />How it works
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">One review, four clear steps</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              CodeReview AI keeps the workflow inside GitHub while turning large diffs into a focused action list.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {workflow.map((step, index) => (
              <div key={step.label} className="rounded-xl border border-white/8 bg-card/50 p-5 text-left">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><step.icon className="h-5 w-5" /></div>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/70 to-teal-500/5 px-6 py-12 sm:px-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><Search className="h-6 w-6" /></div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Ready to review your own pull request?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Connect GitHub, choose an open pull request, and turn its real diff into prioritized feedback in seconds.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-emerald-600 px-7 text-white hover:bg-emerald-700">
              <Link href="/login"><Code2 className="h-5 w-5" />Continue with GitHub<ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 border-white/10 px-7">
              <a href="https://github.com/VinithShetty/AI_Code_review_Assistant" target="_blank" rel="noreferrer">
                <Github className="h-5 w-5" />View source<ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/8 px-4 py-6 text-center text-xs text-muted-foreground">
        Interactive sample by CodeReview AI · Built to assist human reviewers, not replace them.
      </footer>
    </main>
  );
}
