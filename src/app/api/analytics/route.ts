import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/analytics - Analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Security trend (past N days) - from security scans
    const securityScans = await db.securityScan.findMany({
      where: {
        createdAt: { gte: since },
      },
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

    // Group security scans by day
    const securityTrend: {
      date: string;
      totalIssues: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }[] = [];

    const secDayMap = new Map<
      string,
      { totalIssues: number; critical: number; high: number; medium: number; low: number }
    >();

    for (const scan of securityScans) {
      const dayKey = scan.createdAt.toISOString().split("T")[0];
      const existing = secDayMap.get(dayKey) ?? {
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      existing.totalIssues += scan.totalIssues;
      existing.critical += scan.critical;
      existing.high += scan.high;
      existing.medium += scan.medium;
      existing.low += scan.low;
      secDayMap.set(dayKey, existing);
    }

    for (const [date, data] of secDayMap) {
      securityTrend.push({ date, ...data });
    }

    // Category breakdown (security, style, logic, performance counts)
    const categoryBreakdown = await db.reviewComment.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    // Severity breakdown
    const severityBreakdown = await db.reviewComment.groupBy({
      by: ["severity"],
      _count: { severity: true },
      orderBy: { _count: { severity: "desc" } },
    });

    // Team stats - per-developer contribution
    const pullRequests = await db.pullRequest.findMany({
      select: {
        authorLogin: true,
        authorAvatar: true,
        reviews: {
          select: {
            riskScore: true,
            status: true,
            comments: {
              select: { severity: true, category: true },
            },
          },
        },
      },
    });

    // Aggregate per author
    const authorMap = new Map<
      string,
      {
        authorLogin: string;
        authorAvatar: string | null;
        prsCreated: number;
        totalReviews: number;
        avgRiskScore: number;
        riskScores: number[];
        issuesByCategory: Record<string, number>;
        issuesBySeverity: Record<string, number>;
      }
    >();

    for (const pr of pullRequests) {
      const existing = authorMap.get(pr.authorLogin) ?? {
        authorLogin: pr.authorLogin,
        authorAvatar: pr.authorAvatar,
        prsCreated: 0,
        totalReviews: 0,
        avgRiskScore: 0,
        riskScores: [],
        issuesByCategory: {} as Record<string, number>,
        issuesBySeverity: {} as Record<string, number>,
      };

      existing.prsCreated++;

      for (const review of pr.reviews) {
        existing.totalReviews++;
        if (review.riskScore !== null) {
          existing.riskScores.push(review.riskScore);
        }
        for (const comment of review.comments) {
          existing.issuesByCategory[comment.category] =
            (existing.issuesByCategory[comment.category] ?? 0) + 1;
          existing.issuesBySeverity[comment.severity] =
            (existing.issuesBySeverity[comment.severity] ?? 0) + 1;
        }
      }

      authorMap.set(pr.authorLogin, existing);
    }

    const teamStats = Array.from(authorMap.values()).map((author) => ({
      authorLogin: author.authorLogin,
      authorAvatar: author.authorAvatar,
      prsCreated: author.prsCreated,
      totalReviews: author.totalReviews,
      avgRiskScore:
        author.riskScores.length > 0
          ? Math.round(
              (author.riskScores.reduce((a, b) => a + b, 0) /
                author.riskScores.length) *
                10
            ) / 10
          : null,
      issuesByCategory: author.issuesByCategory,
      issuesBySeverity: author.issuesBySeverity,
    }));

    // Review model usage
    const modelUsage = await db.review.groupBy({
      by: ["modelUsed"],
      _count: { modelUsed: true },
      where: { modelUsed: { not: null } },
    });

    return NextResponse.json({
      securityTrend,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      severityBreakdown: severityBreakdown.map((s) => ({
        severity: s.severity,
        count: s._count.severity,
      })),
      teamStats,
      modelUsage: modelUsage.map((m) => ({
        model: m.modelUsed,
        count: m._count.modelUsed,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
