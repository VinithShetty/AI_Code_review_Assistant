import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type SeverityBreakdown = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
};

function emptyBreakdown(): SeverityBreakdown {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

// GET /api/reviews - List reviews (real, DB-backed) with per-review severity breakdown.
// Optional query params: ?status=  ?limit=  ?offset=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      db.review.findMany({
        where,
        select: {
          id: true,
          status: true,
          riskScore: true,
          summary: true,
          modelUsed: true,
          createdAt: true,
          pullRequest: {
            select: {
              githubPrNumber: true,
              title: true,
              authorLogin: true,
              authorAvatar: true,
              repository: {
                select: { fullName: true },
              },
            },
          },
          comments: {
            select: { severity: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.review.count({ where }),
    ]);

    const reviews = rows.map((r) => {
      const severityBreakdown = emptyBreakdown();
      for (const c of r.comments) {
        const key = c.severity as keyof SeverityBreakdown;
        if (key in severityBreakdown) {
          severityBreakdown[key] += 1;
        } else {
          severityBreakdown.info += 1;
        }
      }

      return {
        id: r.id,
        status: r.status,
        riskScore: r.riskScore,
        summary: r.summary,
        modelUsed: r.modelUsed,
        createdAt: r.createdAt,
        pullRequest: {
          number: r.pullRequest.githubPrNumber,
          title: r.pullRequest.title,
          authorLogin: r.pullRequest.authorLogin,
          authorAvatar: r.pullRequest.authorAvatar,
          repository: {
            fullName: r.pullRequest.repository.fullName,
          },
        },
        severityBreakdown,
        totalComments: r.comments.length,
      };
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error listing reviews:", error);
    return NextResponse.json({ error: "Failed to list reviews" }, { status: 500 });
  }
}
