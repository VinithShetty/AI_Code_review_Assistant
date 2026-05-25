'use client';

import { motion } from 'framer-motion';
import DiffViewer from '@/components/reviews/DiffViewer';
import CommentThread from '@/components/reviews/CommentThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { mockReviews, mockDiffLines } from '@/data/mockData';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' },
  complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Complete' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Failed' },
};

export default function ReviewDetailView() {
  const { selectedReviewId, setView } = useAppStore();

  const review = mockReviews.find((r) => r.id === selectedReviewId) || mockReviews[0];
  const pr = review.pullRequest;
  const status = statusConfig[review.status];
  const StatusIcon = status.icon;
  const comments = review.comments || [];

  const severityCounts = comments.reduce(
    (acc, c) => {
      acc[c.severity] = (acc[c.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 -ml-2"
          onClick={() => setView('reviews')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Reviews
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-border flex-shrink-0">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                {pr?.authorLogin?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{pr?.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  #{pr?.githubPrNumber}
                </span>
                <span>·</span>
                <span>{pr?.authorLogin}</span>
                <span>·</span>
                <span>{pr?.repository?.fullName}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-emerald-400" />
                  {pr?.additions}
                </span>
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3 text-red-400" />
                  {pr?.deletions}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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

          {/* Severity breakdown */}
          <div className="flex items-center gap-2 mt-4">
            {Object.entries(severityCounts).map(([severity, count]) => {
              const colors: Record<string, string> = {
                critical: 'bg-red-500/20 text-red-400 border-red-500/30',
                error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                info: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              };
              return (
                <Badge
                  key={severity}
                  variant="outline"
                  className={`${colors[severity]} capitalize`}
                >
                  {count} {severity}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Branch info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
          <div className="text-xs text-muted-foreground mb-1">Base Branch</div>
          <div className="text-sm font-mono">{pr?.baseBranch}</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
          <div className="text-xs text-muted-foreground mb-1">Head Branch</div>
          <div className="text-sm font-mono">{pr?.headBranch}</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
          <div className="text-xs text-muted-foreground mb-1">Changed Files</div>
          <div className="text-sm font-bold flex items-center gap-1">
            <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            {pr?.changedFiles}
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

      {/* Diff viewer */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-emerald-400" />
          Code Changes
        </h2>
        <DiffViewer
          filePath="packages/next/src/server/render.tsx"
          diffLines={mockDiffLines}
          comments={comments}
        />
      </div>

      {/* Comment thread */}
      {comments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            Review Comments ({comments.length})
          </h2>
          <CommentThread comments={comments} />
        </div>
      )}
    </div>
  );
}
