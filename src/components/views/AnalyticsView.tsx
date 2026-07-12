'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import SecurityTrendChart from '@/components/analytics/SecurityTrendChart';
import CategoryBarChart from '@/components/analytics/CategoryBarChart';
import TeamTable from '@/components/analytics/TeamTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityTrendPoint, TeamMember } from '@/types';

// ---- Shape returned by GET /api/analytics ----
interface AnalyticsSecurityTrend {
  period: string; // "YYYY-MM"
  avgSecurityScore: number;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AnalyticsCategory {
  category: string;
  count: number;
}

interface AnalyticsTeamStat {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  reviews: number;
  issuesFound: number;
  avgRisk: number | null;
}

interface AnalyticsResponse {
  securityTrend: AnalyticsSecurityTrend[];
  categoryBreakdown: AnalyticsCategory[];
  teamStats: AnalyticsTeamStat[];
}

// Map the API's monthly "YYYY-MM" period into the chart's SecurityTrendPoint.
function toTrendPoints(trend: AnalyticsSecurityTrend[]): SecurityTrendPoint[] {
  return trend.map((t) => ({
    date: `${t.period}-01`,
    score: t.avgSecurityScore,
    critical: t.critical,
    high: t.high,
    medium: t.medium,
  }));
}

// Map the API's team stats into the TeamTable's TeamMember shape.
function toTeamMembers(stats: AnalyticsTeamStat[]): TeamMember[] {
  return stats.map((s) => ({
    login: s.login,
    avatarUrl: s.avatarUrl ?? '',
    reviewsReceived: s.reviews,
    issuesFound: s.issuesFound,
    avgRiskScore: s.avgRisk ?? 0,
  }));
}

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Insights into your team&apos;s code quality and security posture
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <Card key={i} className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardContent className="p-12 flex flex-col items-center text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Couldn&apos;t load analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Something went wrong while fetching your analytics. Please try again.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-border/60"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-12 flex flex-col items-center text-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Not enough data yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Run some reviews to see analytics. Once you&apos;ve reviewed a few pull
              requests, security trends, issue categories, and team performance will
              show up here.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const isEmpty =
    !!data &&
    data.securityTrend.length === 0 &&
    data.categoryBreakdown.length === 0 &&
    data.teamStats.length === 0;

  return (
    <div className="space-y-6">
      <Header />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={fetchAnalytics} />
      ) : isEmpty || !data ? (
        <EmptyState />
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SecurityTrendChart data={toTrendPoints(data.securityTrend)} />
            <CategoryBarChart data={data.categoryBreakdown} />
          </div>

          {/* Team table */}
          <TeamTable data={toTeamMembers(data.teamStats)} />
        </>
      )}
    </div>
  );
}
