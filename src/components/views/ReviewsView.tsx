'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { mockReviews } from '@/data/mockData';

const statusFilters = ['all', 'complete', 'pending', 'failed'] as const;

export default function ReviewsView() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = mockReviews.filter((r) => {
    const matchesSearch =
      r.pullRequest?.title.toLowerCase().includes(search.toLowerCase()) ||
      r.pullRequest?.authorLogin.toLowerCase().includes(search.toLowerCase()) ||
      r.pullRequest?.repository?.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || r.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
          >
            <RefreshCw className="h-4 w-4" />
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
                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 border-border/50">
                  {mockReviews.filter((r) => r.status === filter).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Review list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((review, idx) => (
            <ReviewCard key={review.id} review={review} index={idx} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
