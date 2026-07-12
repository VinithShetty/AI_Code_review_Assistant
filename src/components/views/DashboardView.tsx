'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MetricsCard from '@/components/dashboard/MetricsCard';
import SecurityIndex from '@/components/dashboard/SecurityIndex';
import TrendChart from '@/components/dashboard/TrendChart';
import ReviewCard from '@/components/reviews/ReviewCard';
import {
  Eye,
  Shield,
  AlertTriangle,
  GitBranch,
  Activity,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { Review, ReviewComment } from '@/types';

// ---- API response shapes (must match the real backend exactly) ----
interface TrendPoint {
  date: string;
  count: number;
  avgRisk: number;
}

interface DashboardResponse {
  metrics: {
    totalReviews: number;
    avgRiskScore: number;
    issuesFound: number;
    reposConnected: number;
    securityScore: number;
    totalSecurityIssues: number;
    criticalIssues: number;
    highIssues: number;
  };
  trends: { reviewTrend: TrendPoint[] };
}

interface ApiSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface ApiReview {
  id: string;
  status: string;
  riskScore: number | null;
  summary: string | null;
  modelUsed: string | null;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
    authorLogin: string;
    authorAvatar: string | null;
    repository: { fullName: string };
  };
  severityBreakdown: ApiSeverityBreakdown;
  totalComments: number;
}

interface ReviewsResponse {
  reviews: ApiReview[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

// Map the free-form DB status string onto the strict Review status union that
// ReviewCard understands ('pending' | 'complete' | 'failed').
function normalizeStatus(raw: string): Review['status'] {
  const v = raw.toLowerCase();
  if (v.includes('complet')) return 'complete';
  if (v.includes('fail') || v.includes('error')) return 'failed';
  return 'pending';
}

// The API returns an aggregated severityBreakdown, not individual comments.
// ReviewCard renders its severity badges by counting `review.comments`, so we
// expand the real counts into typed placeholder comments. Only `severity` is
// rendered; the other fields exist purely to satisfy the shared ReviewComment
// type and are never displayed.
const SEVERITY_MAP: Record<keyof ApiSeverityBreakdown, ReviewComment['severity']> = {
  critical: 'critical',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'info',
};

function expandComments(reviewId: string, createdAt: string, breakdown: ApiSeverityBreakdown): ReviewComment[] {
  const comments: ReviewComment[] = [];
  (Object.keys(breakdown) as (keyof ApiSeverityBreakdown)[]).forEach((key) => {
    const count = breakdown[key];
    for (let i = 0; i < count; i++) {
      comments.push({
        id: `${reviewId}-${key}-${i}`,
        reviewId,
        filePath: '',
        lineNumber: null,
        severity: SEVERITY_MAP[key],
        category: 'security',
        message: '',
        suggestion: null,
        createdAt,
      });
    }
  });
  return comments;
}

// Map the /api/reviews payload onto the Review type ReviewCard consumes. The
// displayed fields (title, PR number, author, repo, risk, summary, model,
// severity counts) are 100% real; structural fields the card never renders are
// left as honest empty/zero placeholders to satisfy the shared type.
function toReview(api: ApiReview): Review {
  return {
    id: api.id,
    prId: '',
    modelUsed: api.modelUsed,
    summary: api.summary,
    riskScore: api.riskScore,
    status: normalizeStatus(api.status),
    rawOutput: null,
    createdAt: api.createdAt,
    updatedAt: api.createdAt,
    pullRequest: {
      id: '',
      repoId: '',
      githubPrNumber: api.pullRequest.number,
      title: api.pullRequest.title,
      description: null,
      authorLogin: api.pullRequest.authorLogin,
      authorAvatar: api.pullRequest.authorAvatar,
      baseBranch: '',
      headBranch: '',
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      status: 'open',
      createdAt: api.createdAt,
      updatedAt: api.createdAt,
      repository: {
        id: '',
        fullName: api.pullRequest.repository.fullName,
        name:
          api.pullRequest.repository.fullName.split('/').pop() ??
          api.pullRequest.repository.fullName,
        description: null,
        language: null,
        isPrivate: false,
        stars: 0,
        openPrs: 0,
        createdAt: api.createdAt,
        updatedAt: api.createdAt,
      },
    },
    comments: expandComments(api.id, api.createdAt, api.severityBreakdown),
  };
}

// Compute a real month-over-month delta in review volume from the daily trend
// series. Returns undefined unless there are two distinct months with a
// non-zero previous month — so we never fabricate a percentage. Only applied to
// the "Total Reviews" card, where "more = up = good" matches MetricsCard's
// colour convention (risk/issues are "lower is better", which this component
// cannot express honestly, so those omit the trend entirely).
function reviewVolumeTrend(
  trend: TrendPoint[]
): { value: number; direction: 'up' | 'down' } | undefined {
  if (trend.length === 0) return undefined;
  const byMonth = new Map<string, number>();
  for (const p of trend) {
    const month = p.date.slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + p.count);
  }
  const months = [...byMonth.keys()].sort();
  if (months.length < 2) return undefined;
  const prev = byMonth.get(months[months.length - 2]) ?? 0;
  const curr = byMonth.get(months[months.length - 1]) ?? 0;
  if (prev <= 0) return undefined;
  const pct = ((curr - prev) / prev) * 100;
  return {
    value: Math.round(Math.abs(pct) * 10) / 10,
    direction: pct >= 0 ? 'up' : 'down',
  };
}

export default function DashboardView() {
  const { setView } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardResponse['metrics'] | null>(null);
  const [reviewTrend, setReviewTrend] = useState<TrendPoint[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, reviewsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/reviews?limit=3'),
      ]);
      if (!dashRes.ok || !reviewsRes.ok) {
        throw new Error('Request failed');
      }
      const dash: DashboardResponse = await dashRes.json();
      const rev: ReviewsResponse = await reviewsRes.json();

      setMetrics(dash.metrics);
      setReviewTrend(dash.trends?.reviewTrend ?? []);
      setRecentReviews((rev.reviews ?? []).map(toReview));
    } catch {
      setError("We couldn't load your dashboard. Please try again.");
      setMetrics(null);
      setReviewTrend([]);
      setRecentReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const header = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Overview of your code review activity and security posture
      </p>
    </motion.div>
  );

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <Skeleton className="h-4 w-32 self-start" />
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error || !metrics) {
    return (
      <div className="space-y-6">
        {header}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-red-500/30 bg-card/80 backdrop-blur">
            <CardContent className="p-10 flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error ?? "We couldn't load your dashboard. Please try again."}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 border-border/50"
                onClick={load}
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const reviewsTrendBadge = reviewVolumeTrend(reviewTrend);
  const hasReviews = metrics.totalReviews > 0;

  return (
    <div className="space-y-6">
      {header}

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Reviews"
          value={metrics.totalReviews}
          icon={Eye}
          trend={reviewsTrendBadge}
          color="emerald"
          index={0}
        />
        <MetricsCard
          title="Avg Risk Score"
          value={metrics.avgRiskScore}
          suffix="/100"
          icon={Activity}
          color="orange"
          index={1}
        />
        <MetricsCard
          title="Issues Found"
          value={metrics.issuesFound}
          icon={AlertTriangle}
          color="red"
          index={2}
        />
        <MetricsCard
          title="Repos Connected"
          value={metrics.reposConnected}
          icon={GitBranch}
          color="teal"
          index={3}
        />
      </div>

      {/* Security Index + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SecurityIndex score={metrics.securityScore} />
        </div>
        <div className="lg:col-span-2">
          {reviewTrend.length > 0 ? (
            <TrendChart data={reviewTrend} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full"
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur h-full">
                <CardContent className="p-6 h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Review Trends
                    </h3>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center h-56 gap-2">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No trend data yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 max-w-xs">
                      Run a few reviews and your activity trend will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
          </div>
          {hasReviews && recentReviews.length > 0 && (
            <Button
              variant="ghost"
              className="text-sm text-emerald-400 hover:text-emerald-300"
              onClick={() => setView('reviews')}
            >
              View all →
            </Button>
          )}
        </div>

        {recentReviews.length > 0 ? (
          <div className="space-y-3">
            {recentReviews.map((review, idx) => (
              <ReviewCard key={review.id} review={review} index={idx} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur border-dashed">
              <CardContent className="p-10 flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">No reviews yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Connect a repository and run your first AI review to see
                    results and insights here.
                  </p>
                </div>
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setView('repositories')}
                >
                  <GitBranch className="h-4 w-4" />
                  Connect a repository
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
