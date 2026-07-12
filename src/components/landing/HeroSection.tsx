'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Brain,
  Users,
  ArrowRight,
  Code2,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

const features = [
  {
    icon: Shield,
    title: 'Security Detection',
    description:
      'Automatically detect SQL injections, hardcoded secrets, XSS vulnerabilities, and 50+ security issues before they reach production.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    icon: Brain,
    title: 'Smart Reviews',
    description:
      'AI-powered code analysis that understands context, catches logic errors, and provides actionable suggestions with code fixes.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: Users,
    title: 'Team Analytics',
    description:
      'Track team performance, identify patterns in code quality, and get insights into your development workflow with detailed metrics.',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
];

const stats = [
  { label: 'Issues Detected', value: '50K+', icon: Shield },
  { label: 'PRs Reviewed', value: '12K+', icon: GitBranch },
  { label: 'Teams Active', value: '500+', icon: Users },
];

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/3 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <Image
            src="/codereview-logo.png"
            alt="CodeReview AI logo"
            width={88}
            height={88}
            className="rounded-2xl"
            priority
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-Powered Code Intelligence
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
        >
          AI-Powered Code Reviews
          <br />
          <span className="text-emerald-400">at Scale</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Catch security vulnerabilities, logic errors, and performance issues
          before they reach production. Get intelligent insights into your team&apos;s
          code quality with AI-driven analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8 h-12 gap-2"
            onClick={() => router.push('/login')}
          >
            <Code2 className="h-5 w-5" />
            Get Started with GitHub
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-base px-8 h-12 border-border/50 hover:bg-muted/50"
          >
            View Demo
          </Button>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex items-center justify-center gap-8 sm:gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon className="h-4 w-4 text-emerald-400" />
                <span className="text-2xl sm:text-3xl font-bold">{stat.value}</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
              className={`rounded-xl border ${feature.borderColor} bg-card/60 backdrop-blur p-6 text-left hover:bg-card/80 transition-all group`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
