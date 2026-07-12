'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitPullRequest, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/appStore';

interface PullRequestItem {
  number: number;
  title: string;
  authorLogin: string;
  htmlUrl: string;
}

interface ReviewPRModalProps {
  owner: string;
  repo: string;
  fullName: string;
  children: React.ReactNode;
}

export default function ReviewPRModal({ owner, repo, fullName, children }: ReviewPRModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pulls, setPulls] = useState<PullRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/github/repos/${owner}/${repo}/pulls`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.hint || body.error || `Request failed (${res.status})`);
        if (!cancelled) setPulls(body.pullRequests ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load pull requests');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, owner, repo]);

  const runReview = async (prNumber: number) => {
    setRunning(prNumber);
    try {
      const res = await fetch('/api/reviews/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, prNumber }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.details || body.error || `Failed (${res.status})`);
      toast({
        title: 'AI review complete',
        description: `Finished analyzing ${fullName} #${prNumber}.`,
      });
      setOpen(false);
      if (body.reviewId) {
        useAppStore.getState().selectReview(body.reviewId);
      } else {
        useAppStore.getState().setView('reviews');
      }
    } catch (e) {
      toast({
        title: 'Review failed',
        description: e instanceof Error ? e.message : 'Could not run the AI review.',
        variant: 'destructive',
      });
    } finally {
      setRunning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (running === null ? setOpen(o) : null)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-emerald-400" />
            Run AI Review
          </DialogTitle>
          <DialogDescription>
            Pick an open pull request in{' '}
            <span className="font-medium text-foreground">{fullName}</span> to analyze with AI.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading open pull requests…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 text-center py-8 text-sm text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : pulls.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No open pull requests in this repository.
            </div>
          ) : (
            pulls.map((pr) => (
              <div
                key={pr.number}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{pr.number}</span>
                    <span className="text-sm font-medium truncate">{pr.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">by {pr.authorLogin}</div>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-shrink-0"
                  disabled={running !== null}
                  onClick={() => runReview(pr.number)}
                >
                  {running === pr.number ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Reviewing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Run AI review
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
