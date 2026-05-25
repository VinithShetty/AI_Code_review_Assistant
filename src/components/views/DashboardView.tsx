'use client';

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
} from 'lucide-react';
import { mockDashboardMetrics, mockReviews } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';

export default function DashboardView() {
  const { setView } = useAppStore();
  const metrics = mockDashboardMetrics;
  const recentReviews = mockReviews.slice(0, 3);

  return (
    <div className="space-y-6">
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

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Reviews"
          value={metrics.totalReviews}
          icon={Eye}
          trend={{ value: 16.8, direction: 'up' }}
          color="emerald"
          index={0}
        />
        <MetricsCard
          title="Avg Risk Score"
          value={metrics.avgRiskScore}
          suffix="/100"
          icon={Activity}
          trend={{ value: 7.9, direction: 'down' }}
          color="orange"
          index={1}
        />
        <MetricsCard
          title="Issues Found"
          value={metrics.issuesFound}
          icon={AlertTriangle}
          trend={{ value: 12.3, direction: 'up' }}
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
          <TrendChart data={metrics.reviewsTrend} />
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
          </div>
          <Button
            variant="ghost"
            className="text-sm text-emerald-400 hover:text-emerald-300"
            onClick={() => setView('reviews')}
          >
            View all →
          </Button>
        </div>
        <div className="space-y-3">
          {recentReviews.map((review, idx) => (
            <ReviewCard key={review.id} review={review} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
