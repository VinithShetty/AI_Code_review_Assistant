import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews - List all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const repoId = searchParams.get("repoId");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    if (repoId) {
      where.pullRequest = { repoId };
    }

    // If severity is specified, filter by reviews that have comments with that severity
    if (severity) {
      where.comments = {
        some: { severity },
      };
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          pullRequest: {
            select: {
              id: true,
              title: true,
              githubPrNumber: true,
              authorLogin: true,
              authorAvatar: true,
              status: true,
              repository: {
                select: {
                  id: true,
                  fullName: true,
                  name: true,
                  language: true,
                },
              },
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.review.count({ where }),
    ]);

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
    return NextResponse.json(
      { error: "Failed to list reviews" },
      { status: 500 }
    );
  }
}
