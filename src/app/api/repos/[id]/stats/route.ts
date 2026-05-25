import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/repos/[id]/stats - Repository stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repository = await db.repository.findUnique({
      where: { id },
      select: { id: true, fullName: true },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Total PRs
    const totalPrs = await db.pullRequest.count({
      where: { repoId: id },
    });

    // PRs by status
    const prsByStatus = await db.pullRequest.groupBy({
      by: ["status"],
      where: { repoId: id },
      _count: { status: true },
    });

    // Total reviews
    const totalReviews = await db.review.count({
      where: {
        pullRequest: { repoId: id },
      },
    });

    // Reviews by status
    const reviewsByStatus = await db.review.groupBy({
      by: ["status"],
      where: {
        pullRequest: { repoId: id },
      },
      _count: { status: true },
    });

    // Average risk score (only completed reviews)
    const completedReviews = await db.review.findMany({
      where: {
        pullRequest: { repoId: id },
        status: "completed",
        riskScore: { not: null },
      },
      select: { riskScore: true },
    });

    const avgRiskScore =
      completedReviews.length > 0
        ? completedReviews.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) /
          completedReviews.length
        : null;

    // Comment severity breakdown
    const commentsBySeverity = await db.reviewComment.groupBy({
      by: ["severity"],
      where: {
        review: {
          pullRequest: { repoId: id },
        },
      },
      _count: { severity: true },
    });

    // Comment category breakdown
    const commentsByCategory = await db.reviewComment.groupBy({
      by: ["category"],
      where: {
        review: {
          pullRequest: { repoId: id },
        },
      },
      _count: { category: true },
    });

    // Security scan summary
    const securityScans = await db.securityScan.findMany({
      where: { repoId: id },
      select: {
        totalIssues: true,
        critical: true,
        high: true,
        medium: true,
        low: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const totalIssues = securityScans.reduce(
      (sum, scan) => sum + scan.totalIssues,
      0
    );

    return NextResponse.json({
      repository,
      stats: {
        totalPrs,
        prsByStatus: prsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        totalReviews,
        reviewsByStatus: reviewsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        avgRiskScore: avgRiskScore !== null ? Math.round(avgRiskScore * 10) / 10 : null,
        commentsBySeverity: commentsBySeverity.map((s) => ({
          severity: s.severity,
          count: s._count.severity,
        })),
        commentsByCategory: commentsByCategory.map((s) => ({
          category: s.category,
          count: s._count.category,
        })),
        securityScans,
        totalSecurityIssues: totalIssues,
      },
    });
  } catch (error) {
    console.error("Error fetching repository stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository stats" },
      { status: 500 }
    );
  }
}
