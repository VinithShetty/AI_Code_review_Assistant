import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/metrics/summary - Aggregate summary counts
export async function GET() {
  try {
    const [
      totalRepos,
      totalPrs,
      totalReviews,
      totalComments,
      totalSecurityScans,
      totalAnalyticsEvents,
    ] = await Promise.all([
      db.repository.count(),
      db.pullRequest.count(),
      db.review.count(),
      db.reviewComment.count(),
      db.securityScan.count(),
      db.analyticsEvent.count(),
    ]);

    // Comments by severity
    const commentsBySeverity = await db.reviewComment.groupBy({
      by: ["severity"],
      _count: { severity: true },
    });

    // Comments by category
    const commentsByCategory = await db.reviewComment.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    // Reviews by status
    const reviewsByStatus = await db.review.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // PRs by status
    const prsByStatus = await db.pullRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Repos by language
    const reposByLanguage = await db.repository.groupBy({
      by: ["language"],
      _count: { language: true },
      where: { language: { not: null } },
    });

    return NextResponse.json({
      totalRepos,
      totalPrs,
      totalReviews,
      totalComments,
      totalSecurityScans,
      totalAnalyticsEvents,
      commentsBySeverity: commentsBySeverity.map((s) => ({
        severity: s.severity,
        count: s._count.severity,
      })),
      commentsByCategory: commentsByCategory.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      reviewsByStatus: reviewsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      prsByStatus: prsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      reposByLanguage: reposByLanguage.map((l) => ({
        language: l.language,
        count: l._count.language,
      })),
    });
  } catch (error) {
    console.error("Error fetching summary metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary metrics" },
      { status: 500 }
    );
  }
}
