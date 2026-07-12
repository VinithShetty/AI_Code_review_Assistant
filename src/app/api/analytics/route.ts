import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Per-scan security score: 100 minus a weighted penalty for issues found.
function scanSecurityScore(scan: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}): number {
  const penalty = scan.critical * 20 + scan.high * 10 + scan.medium * 4 + scan.low * 1;
  return Math.max(0, 100 - Math.min(100, penalty));
}

// GET /api/analytics - Real, DB-backed analytics.
// Optional query param: ?days= (window for securityTrend, default 180)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.max(1, parseInt(searchParams.get("days") ?? "180", 10) || 180);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // ---- securityTrend: monthly avg security score + issue totals ----
    const securityScans = await db.securityScan.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        totalIssues: true,
        critical: true,
        high: true,
        medium: true,
        low: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const monthMap = new Map<
      string,
      {
        totalIssues: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        scoreSum: number;
        scanCount: number;
      }
    >();

    for (const scan of securityScans) {
      const d = scan.createdAt;
      const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const existing =
        monthMap.get(period) ?? {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          scoreSum: 0,
          scanCount: 0,
        };
      existing.totalIssues += scan.totalIssues;
      existing.critical += scan.critical;
      existing.high += scan.high;
      existing.medium += scan.medium;
      existing.low += scan.low;
      existing.scoreSum += scanSecurityScore(scan);
      existing.scanCount += 1;
      monthMap.set(period, existing);
    }

    const securityTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({
        period,
        avgSecurityScore: v.scanCount > 0 ? Math.round(v.scoreSum / v.scanCount) : 100,
        totalIssues: v.totalIssues,
        critical: v.critical,
        high: v.high,
        medium: v.medium,
        low: v.low,
      }));

    // ---- categoryBreakdown: ReviewComment grouped by category ----
    const categoryGroups = await db.reviewComment.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });
    const categoryBreakdown = categoryGroups.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));

    // ---- teamStats: per PR-author, reviews / issuesFound / avgRisk ----
    const pullRequests = await db.pullRequest.findMany({
      select: {
        authorLogin: true,
        authorAvatar: true,
        reviews: {
          select: {
            riskScore: true,
            _count: { select: { comments: true } },
          },
        },
      },
    });

    // Map known app users (login -> name) so teamStats can carry a display name.
    const users = await db.user.findMany({ select: { login: true, name: true } });
    const nameByLogin = new Map<string, string | null>();
    for (const u of users) nameByLogin.set(u.login, u.name);

    const authorMap = new Map<
      string,
      {
        login: string;
        avatarUrl: string | null;
        reviews: number;
        issuesFound: number;
        riskScores: number[];
      }
    >();

    for (const pr of pullRequests) {
      const existing =
        authorMap.get(pr.authorLogin) ?? {
          login: pr.authorLogin,
          avatarUrl: pr.authorAvatar,
          reviews: 0,
          issuesFound: 0,
          riskScores: [],
        };
      for (const review of pr.reviews) {
        existing.reviews += 1;
        existing.issuesFound += review._count.comments;
        if (review.riskScore !== null) existing.riskScores.push(review.riskScore);
      }
      authorMap.set(pr.authorLogin, existing);
    }

    const teamStats = Array.from(authorMap.values())
      .map((a) => ({
        login: a.login,
        name: nameByLogin.get(a.login) ?? null,
        avatarUrl: a.avatarUrl,
        reviews: a.reviews,
        issuesFound: a.issuesFound,
        avgRisk:
          a.riskScores.length > 0
            ? Math.round((a.riskScores.reduce((x, y) => x + y, 0) / a.riskScores.length) * 10) / 10
            : null,
      }))
      .sort((x, y) => y.reviews - x.reviews);

    return NextResponse.json({
      securityTrend,
      categoryBreakdown,
      teamStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
