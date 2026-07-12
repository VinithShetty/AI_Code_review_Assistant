'use client';

import { Review } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  review: Review;
  index?: number;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' },
  complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Complete' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Failed' },
};

const riskConfig = (score: number) => {
  if (score >= 75) return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'High Risk' };
  if (score >= 40) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Medium Risk' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Low Risk' };
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const { selectReview } = useAppStore();
  const status = statusConfig[review.status];
  const StatusIcon = status.icon;
  const pr = review.pullRequest;

  const severityCounts: Record<string, number> = {};
  if (review.comments) {
    review.comments.forEach((c) => {
      severityCounts[c.severity] = (severityCounts[c.severity] || 0) + 1;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="border-border/50 bg-card/80 backdrop-blur hover:bg-card/90 hover:border-emerald-500/30 transition-all cursor-pointer group"
        onClick={() => selectReview(review.id)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border border-border flex-shrink-0">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
                {pr?.authorLogin?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">
                    {pr?.title || 'Unknown PR'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitPullRequest className="h-3 w-3" />
                      #{pr?.githubPrNumber}
                    </span>
                    <span>·</span>
                    <span>{pr?.authorLogin}</span>
                    <span>·</span>
                    <span>{pr?.repository?.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`${status.bg} ${status.border} ${status.color} gap-1 text-xs`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                  {review.riskScore !== null && (
                    <Badge
                      variant="outline"
                      className={`${riskConfig(review.riskScore).bg} ${riskConfig(review.riskScore).color} text-xs font-bold`}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {review.riskScore}
                    </Badge>
                  )}
                </div>
              </div>

              {review.summary && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {review.summary}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  {Object.entries(severityCounts).map(([severity, count]) => (
                    <Badge
                      key={severity}
                      variant="outline"
                      className={`${severityColors[severity]} text-[10px] px-1.5 py-0`}
                    >
                      {count} {severity}
                    </Badge>
                  ))}
                  {review.modelUsed && (
                    <span className="text-[10px] text-muted-foreground ml-2">
                      via {review.modelUsed}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
