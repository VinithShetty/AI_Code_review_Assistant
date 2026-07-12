'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReviewCard from '@/components/reviews/ReviewCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Review, ReviewComment } from '@/types';

// ---- API response shapes (must match GET /api/reviews exactly) ------------

type ApiSeverityBreakdown = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
};

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

interface ApiReviewsResponse {
  reviews: ApiReview[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

// ---- Adapters: API DTO -> the Review view type ReviewCard consumes --------

// UI status filters. DB may store 'completed' (not 'complete'), so we
// normalize every raw status into one of ReviewCard's three known keys.
const statusFilters = ['all', 'complete', 'pending', 'failed'] as const;
type StatusFilter = (typeof statusFilters)[number];
type UiStatus = Exclude<StatusFilter, 'all'>;

function normalizeStatus(raw: string): UiStatus {
  const s = (raw || '').toLowerCase();
  if (s === 'complete' || s === 'completed' || s === 'done' || s === 'success') {
    return 'complete';
  }
  if (s === 'failed' || s === 'error') {
    return 'failed';
  }
  // pending, queued, in_progress, processing, running, unknown -> pending
  return 'pending';
}

// Map the analytics-style breakdown buckets onto ReviewComment's severity
// union so ReviewCard's severity badges keep their existing colors:
// critical=red, error(high)=orange, warning(medium)=yellow, info(low/info)=teal.
const severityFromBucket: Record<keyof ApiSeverityBreakdown, ReviewComment['severity']> = {
  critical: 'critical',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'info',
};

// ReviewCard derives its per-severity counts from review.comments, so we
// expand the real breakdown counts into typed comment stubs. Only `severity`
// is ever read/rendered; the rest are structural placeholders.
function breakdownToComments(reviewId: string, b: ApiSeverityBreakdown): ReviewComment[] {
  const out: ReviewComment[] = [];
  (Object.keys(b) as (keyof ApiSeverityBreakdown)[]).forEach((bucket) => {
    const count = b[bucket];
    const severity = severityFromBucket[bucket];
    for (let i = 0; i < count; i++) {
      out.push({
        id: `${reviewId}:${bucket}:${i}`,
        reviewId,
        filePath: '',
        lineNumber: null,
        severity,
        category: 'style',
        message: '',
        suggestion: null,
        createdAt: reviewId,
      });
    }
  });
  return out;
}

function toReview(r: ApiReview): Review {
  const fullName = r.pullRequest.repository.fullName;
  return {
    id: r.id,
    prId: '',
    modelUsed: r.modelUsed,
    summary: r.summary,
    riskScore: r.riskScore,
    status: normalizeStatus(r.status),
    rawOutput: null,
    createdAt: r.createdAt,
    updatedAt: r.createdAt,
    pullRequest: {
      id: '',
      repoId: '',
      githubPrNumber: r.pullRequest.number,
      title: r.pullRequest.title,
      description: null,
      authorLogin: r.pullRequest.authorLogin,
      authorAvatar: r.pullRequest.authorAvatar,
      baseBranch: '',
      headBranch: '',
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      status: 'open',
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
      repository: {
        id: '',
        fullName,
        name: fullName.split('/').pop() ?? fullName,
        description: null,
        language: null,
        isPrivate: false,
        stars: 0,
        openPrs: 0,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      },
    },
    comments: breakdownToComments(r.id, r.severityBreakdown),
  };
}

// ---------------------------------------------------------------------------

export default function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews?limit=100', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data: ApiReviewsResponse = await res.json();
      setReviews(data.reviews.map(toReview));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Per-status counts from the REAL (normalized) data.
  const statusCounts = useMemo(() => {
    const counts: Record<UiStatus, number> = { complete: 0, pending: 0, failed: 0 };
    for (const r of reviews) {
      counts[r.status as UiStatus] += 1;
    }
    return counts;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchesFilter = activeFilter === 'all' || r.status === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const pr = r.pullRequest;
      return (
        (pr?.title.toLowerCase().includes(q) ?? false) ||
        (pr?.authorLogin.toLowerCase().includes(q) ?? false) ||
        (pr?.repository?.fullName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [reviews, search, activeFilter]);

  const hasReviews = reviews.length > 0;
  const isFiltering = search.trim() !== '' || activeFilter !== 'all';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reviews</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered code review results and insights
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-border/50"
            onClick={fetchReviews}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews by PR title, author, or repo..."
            className="pl-9 bg-muted/30 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {statusFilters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs capitalize ${
                activeFilter === filter
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
              {filter !== 'all' && (
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] px-1 py-0 border-border/50"
                >
                  {statusCounts[filter]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Body: loading / error / empty / list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 text-emerald-400/60 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load reviews — {error}
          </p>
          <Button
            variant="outline"
            className="mt-4 text-sm gap-2 border-border/50"
            onClick={fetchReviews}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((review, idx) => (
            <ReviewCard key={review.id} review={review} index={idx} />
          ))}
        </div>
      ) : hasReviews && isFiltering ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No reviews found matching your criteria
          </p>
          <Button
            variant="outline"
            className="mt-4 text-sm"
            onClick={() => {
              setSearch('');
              setActiveFilter('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Run an AI review on a pull request and the results will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
