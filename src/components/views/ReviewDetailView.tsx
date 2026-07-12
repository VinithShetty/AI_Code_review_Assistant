'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CommentThread from '@/components/reviews/CommentThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  MessageSquare,
  Plus,
  Minus,
  FileText,
  Bot,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import type { ReviewComment } from '@/types';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' },
  complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Complete' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Failed' },
} as const;

function normalizeStatus(s: string): keyof typeof statusConfig {
  if (s === 'completed' || s === 'complete') return 'complete';
  if (s === 'failed') return 'failed';
  return 'pending';
}

interface ReviewDetail {
  review: {
    id: string;
    status: string;
    riskScore: number | null;
    summary: string | null;
    modelUsed: string | null;
    pullRequest?: {
      githubPrNumber: number;
      title: string;
      authorLogin: string;
      authorAvatar: string | null;
      baseBranch: string;
      headBranch: string;
      additions: number;
      deletions: number;
      changedFiles: number;
      repository?: { fullName: string } | null;
    } | null;
    comments?: ReviewComment[];
  };
  summary?: {
    totalComments: number;
    severityCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
  };
}

const severityBadgeColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export default function ReviewDetailView() {
  const { selectedReviewId, setView } = useAppStore();
  const [data, setData] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedReviewId) {
      setLoading(false);
      setError('No review selected.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reviews/${selectedReviewId}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load review');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedReviewId]);

  const BackButton = (
    <Button
      variant="ghost"
      className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2"
      onClick={() => setView('reviews')}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Reviews
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {BackButton}
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading review…
        </div>
      </div>
    );
  }

  if (error || !data?.review) {
    return (
      <div className="space-y-6">
        {BackButton}
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Couldn&apos;t load this review</p>
          <p className="text-xs text-muted-foreground mb-4">{error ?? 'Review not found.'}</p>
          <Button variant="outline" size="sm" className="border-border/50" onClick={() => setView('reviews')}>
            Back to Reviews
          </Button>
        </div>
      </div>
    );
  }

  const review = data.review;
  const pr = review.pullRequest;
  const status = statusConfig[normalizeStatus(review.status)];
  const StatusIcon = status.icon;
  const comments = (review.comments ?? []) as ReviewComment[];
  const severityCounts = data.summary?.severityCounts ?? {};
  const prUrl =
    pr?.repository?.fullName != null
      ? `https://github.com/${pr.repository.fullName}/pull/${pr.githubPrNumber}`
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {BackButton}

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-border flex-shrink-0">
              {pr?.authorAvatar && <AvatarImage src={pr.authorAvatar} alt={pr.authorLogin} />}
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                {pr?.authorLogin?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{pr?.title ?? 'Review'}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                {pr && (
                  <>
                    <span className="flex items-center gap-1">
                      <GitPullRequest className="h-3.5 w-3.5" />#{pr.githubPrNumber}
                    </span>
                    <span>·</span>
                    <span>{pr.authorLogin}</span>
                    <span>·</span>
                    <span>{pr.repository?.fullName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3 text-emerald-400" />
                      {pr.additions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Minus className="h-3 w-3 text-red-400" />
                      {pr.deletions}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Badge variant="outline" className={`${status.bg} ${status.border} ${status.color} gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            {review.riskScore !== null && (
              <Badge
                variant="outline"
                className={`gap-1 font-bold ${
                  review.riskScore >= 75
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : review.riskScore >= 40
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Risk: {review.riskScore}/100
              </Badge>
            )}
            {review.modelUsed && (
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50 gap-1">
                <Bot className="h-3 w-3" />
                {review.modelUsed}
              </Badge>
            )}
            {prUrl && (
              <Button asChild variant="outline" size="sm" className="border-border/50 gap-1.5">
                <a href={prUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Summary card */}
      {review.summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-400">AI Summary</h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{review.summary}</p>

          {Object.keys(severityCounts).length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {Object.entries(severityCounts).map(([severity, count]) => (
                <Badge
                  key={severity}
                  variant="outline"
                  className={`${severityBadgeColors[severity] ?? 'bg-muted/40 text-muted-foreground border-border/50'} capitalize`}
                >
                  {count} {severity}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* PR meta */}
      {pr && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="text-xs text-muted-foreground mb-1">Base Branch</div>
            <div className="text-sm font-mono truncate">{pr.baseBranch}</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="text-xs text-muted-foreground mb-1">Head Branch</div>
            <div className="text-sm font-mono truncate">{pr.headBranch || '—'}</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="text-xs text-muted-foreground mb-1">Changed Files</div>
            <div className="text-sm font-bold flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
              {pr.changedFiles}
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="text-xs text-muted-foreground mb-1">Comments</div>
            <div className="text-sm font-bold flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              {comments.length}
            </div>
          </div>
        </motion.div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          Review Comments ({comments.length})
        </h2>
        {comments.length > 0 ? (
          <CommentThread comments={comments} />
        ) : (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium">No issues flagged</p>
            <p className="text-xs text-muted-foreground mt-1">
              The AI review didn&apos;t surface any comments for this pull request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
