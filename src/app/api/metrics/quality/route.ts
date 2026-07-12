import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/metrics/quality - Code quality score based on recent reviews
export async function GET() {
  try {
    // Get completed reviews with risk scores
    const completedReviews = await db.review.findMany({
      where: {
        status: "completed",
        riskScore: { not: null },
      },
      include: {
        comments: {
          select: {
            severity: true,
            category: true,
          },
        },
        pullRequest: {
          select: {
            id: true,
            title: true,
            additions: true,
            deletions: true,
            changedFiles: true,
            repository: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (completedReviews.length === 0) {
      return NextResponse.json({
        qualityScore: null,
        message: "No completed reviews available to calculate quality score",
      });
    }

    // Calculate quality score components
    const avgRiskScore =
      completedReviews.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) /
      completedReviews.length;

    // Risk score contributes (inverse: lower risk = higher quality)
    const riskComponent = Math.max(0, (10 - avgRiskScore) / 10) * 40; // 40% weight

    // Count issues by severity
    const totalComments = completedReviews.reduce(
      (sum, r) => sum + r.comments.length,
      0
    );
    const criticalCount = completedReviews.reduce(
      (sum, r) =>
        sum + r.comments.filter((c) => c.severity === "critical").length,
      0
    );
    const highCount = completedReviews.reduce(
      (sum, r) =>
        sum + r.comments.filter((c) => c.severity === "high").length,
      0
    );
    const mediumCount = completedReviews.reduce(
      (sum, r) =>
        sum + r.comments.filter((c) => c.severity === "medium").length,
      0
    );
    const lowCount = completedReviews.reduce(
      (sum, r) =>
        sum + r.comments.filter((c) => c.severity === "low").length,
      0
    );

    // Issue density (issues per review) - lower is better
    const issueDensity = totalComments / completedReviews.length;
    const densityComponent = Math.max(0, (5 - issueDensity) / 5) * 30; // 30% weight

    // Security issue ratio (critical + high as % of total)
    const securityRatio =
      totalComments > 0
        ? (criticalCount + highCount) / totalComments
        : 0;
    const securityComponent = Math.max(0, (1 - securityRatio)) * 30; // 30% weight

    const overallScore = Math.round(
      riskComponent + densityComponent + securityComponent
    );

    // Per-repo quality scores
    const repoScores = new Map<
      string,
      {
        fullName: string;
        reviewCount: number;
        avgRisk: number;
        issueCount: number;
        qualityScore: number;
      }
    >();

    for (const review of completedReviews) {
      const repoId = review.pullRequest.repository.id;
      const fullName = review.pullRequest.repository.fullName;

      const existing = repoScores.get(repoId) ?? {
        fullName,
        reviewCount: 0,
        avgRisk: 0,
        riskSum: 0,
        issueCount: 0,
        qualityScore: 0,
      };

      existing.reviewCount++;
      existing.riskSum += review.riskScore ?? 0;
      existing.issueCount += review.comments.length;

      repoScores.set(repoId, existing as typeof existing & { riskSum: number });
    }

    const repoQualityScores = Array.from(repoScores.entries()).map(
      ([repoId, data]) => {
        const avgRisk = data.riskSum / data.reviewCount;
        const repoScore = Math.round(
          Math.max(0, (10 - avgRisk) / 10) * 100
        );
        return {
          repoId,
          fullName: data.fullName,
          reviewCount: data.reviewCount,
          avgRisk: Math.round(avgRisk * 10) / 10,
          issueCount: data.issueCount,
          qualityScore: repoScore,
        };
      }
    );

    return NextResponse.json({
      qualityScore: overallScore,
      components: {
        riskComponent: Math.round(riskComponent * 10) / 10,
        densityComponent: Math.round(densityComponent * 10) / 10,
        securityComponent: Math.round(securityComponent * 10) / 10,
      },
      details: {
        totalReviews: completedReviews.length,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        issueDensity: Math.round(issueDensity * 10) / 10,
        totalIssues: totalComments,
        issuesBySeverity: {
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
        },
      },
      repoQualityScores,
    });
  } catch (error) {
    console.error("Error calculating quality score:", error);
    return NextResponse.json(
      { error: "Failed to calculate quality score" },
      { status: 500 }
    );
  }
}
