'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Github, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  // Already signed in? Send them to the app.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl"
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image
            src="/codereview-logo.png"
            alt="CodeReview AI logo"
            width={48}
            height={48}
            className="rounded-xl"
            priority
          />
          <span className="text-xl font-bold tracking-tight">
            Code<span className="text-emerald-400">Review</span> AI
          </span>
        </div>

        {/* Heading + value proposition */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Sign in to continue
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Connect your GitHub account to run AI-powered code reviews on your real
          pull requests.
        </p>

        {/* Sign in button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8"
        >
          <Button
            size="lg"
            disabled={status === 'loading'}
            onClick={() => signIn('github', { callbackUrl: '/' })}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base h-12 gap-2.5"
          >
            {status === 'loading' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Github className="h-5 w-5" />
            )}
            Continue with GitHub
          </Button>
        </motion.div>

        {/* Trust note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          We only read the repositories you authorize. Nothing is shared.
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 mt-8 text-center text-xs text-muted-foreground"
      >
        © 2024 CodeReview AI — AI-Powered Code Review Assistant
      </motion.p>
    </div>
  );
}
