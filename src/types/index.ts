export type PageView = 'landing' | 'dashboard' | 'repositories' | 'reviews' | 'review-detail' | 'analytics';

export interface User {
  id: string;
  login: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface Repository {
  id: string;
  fullName: string;
  name: string;
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  stars: number;
  openPrs: number;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  repoId: string;
  githubPrNumber: number;
  title: string;
  description: string | null;
  authorLogin: string;
  authorAvatar: string | null;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  status: 'open' | 'closed' | 'merged';
  createdAt: string;
  updatedAt: string;
  repository?: Repository;
}

export interface Review {
  id: string;
  prId: string;
  modelUsed: string | null;
  summary: string | null;
  riskScore: number | null;
  status: 'pending' | 'complete' | 'failed';
  rawOutput: string | null;
  createdAt: string;
  updatedAt: string;
  pullRequest?: PullRequest;
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  filePath: string;
  lineNumber: number | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'security' | 'style' | 'logic' | 'performance';
  message: string;
  suggestion: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalReviews: number;
  avgRiskScore: number;
  issuesFound: number;
  reposConnected: number;
  securityScore: number;
  reviewsTrend: { date: string; count: number; avgRisk: number }[];
}

export interface SecurityTrendPoint {
  date: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
}

export interface TeamMember {
  login: string;
  avatarUrl: string;
  reviewsReceived: number;
  issuesFound: number;
  avgRiskScore: number;
}

export interface AnalyticsData {
  securityTrend: SecurityTrendPoint[];
  categoryBreakdown: { category: string; count: number }[];
  teamStats: TeamMember[];
}
