'use client';

import { motion } from 'framer-motion';
import SecurityTrendChart from '@/components/analytics/SecurityTrendChart';
import CategoryBarChart from '@/components/analytics/CategoryBarChart';
import TeamTable from '@/components/analytics/TeamTable';
import { mockAnalyticsData } from '@/data/mockData';

export default function AnalyticsView() {
  const analytics = mockAnalyticsData;

  return (
    <div className="space-y-6">
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecurityTrendChart data={analytics.securityTrend} />
        <CategoryBarChart data={analytics.categoryBreakdown} />
      </div>

      {/* Team table */}
      <TeamTable data={analytics.teamStats} />
    </div>
  );
}
