import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/prs - List all PRs across repos with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const status = searchParams.get("status");
    const repoId = searchParams.get("repoId");
    const author = searchParams.get("author");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (repoId) where.repoId = repoId;
    if (author) where.authorLogin = author;

    const [pullRequests, total] = await Promise.all([
      db.pullRequest.findMany({
        where,
        include: {
          repository: {
            select: {
              id: true,
              fullName: true,
              name: true,
              language: true,
            },
          },
          reviews: {
            select: {
              id: true,
              status: true,
              riskScore: true,
              modelUsed: true,
              summary: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.pullRequest.count({ where }),
    ]);

    return NextResponse.json({
      pullRequests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error listing pull requests:", error);
    return NextResponse.json(
      { error: "Failed to list pull requests" },
      { status: 500 }
    );
  }
}
