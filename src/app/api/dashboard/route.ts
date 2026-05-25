import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard - Aggregate dashboard metrics
export async function GET() {
  try {
    // Total reviews
    const totalReviews = await db.review.count();

    // Average risk score (completed reviews only)
    const completedReviews = await db.review.findMany({
      where: {
        status: "completed",
        riskScore: { not: null },
      },
      select: { riskScore: true, createdAt: true },
    });

    const avgRiskScore =
      completedReviews.length > 0
        ? Math.round(
            (completedReviews.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) /
              completedReviews.length) *
              10
          ) / 10
        : 0;

    // Total issues found (count all review comments)
    const issuesFound = await db.reviewComment.count();

    // Repos connected
    const reposConnected = await db.repository.count();

    // Security score (based on security scan findings)
    const securityScans = await db.securityScan.findMany({
      select: {
        totalIssues: true,
        critical: true,
        high: true,
      },
    });

    const totalSecurityIssues = securityScans.reduce(
      (sum, scan) => sum + scan.totalIssues,
      0
    );
    const criticalIssues = securityScans.reduce(
      (sum, scan) => sum + scan.critical,
      0
    );
    const highIssues = securityScans.reduce(
      (sum, scan) => sum + scan.high,
      0
    );

    // Calculate security score (100 - penalty)
    // Critical issues: -15 each, High issues: -8 each, Medium: -3 each
    const securityScore = Math.max(
      0,
      Math.min(
        100,
        100 - criticalIssues * 15 - highIssues * 8
      )
    );

    // 30-day trend data for reviews
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await db.review.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
        riskScore: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group reviews by day
    const reviewTrend: { date: string; count: number; avgRisk: number }[] = [];
    const dayMap = new Map<string, { count: number; riskSum: number }>();

    for (const review of recentReviews) {
      const dayKey = review.createdAt.toISOString().split("T")[0];
      const existing = dayMap.get(dayKey) ?? { count: 0, riskSum: 0 };
      existing.count++;
      if (review.riskScore !== null) existing.riskSum += review.riskScore;
      dayMap.set(dayKey, existing);
    }

    for (const [date, data] of dayMap) {
      reviewTrend.push({
        date,
        count: data.count,
        avgRisk:
          data.count > 0
            ? Math.round((data.riskSum / data.count) * 10) / 10
            : 0,
      });
    }

    // Review status breakdown
    const reviewsByStatus = await db.review.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Recent activity (last 10 events)
    const recentActivity = await db.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      metrics: {
        totalReviews,
        avgRiskScore,
        issuesFound,
        reposConnected,
        securityScore,
        totalSecurityIssues,
        criticalIssues,
        highIssues,
      },
      trends: {
        reviewTrend,
      },
      reviewsByStatus: reviewsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentActivity: recentActivity.map((event) => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
