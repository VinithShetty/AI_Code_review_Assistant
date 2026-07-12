import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews/[id]/comments - Paginated comments for a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const filePath = searchParams.get("filePath");

    // Verify review exists
    const review = await db.review.findUnique({
      where: { id },
      select: { id: true, prId: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { reviewId: id };
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (filePath) where.filePath = { contains: filePath };

    const [comments, total] = await Promise.all([
      db.reviewComment.findMany({
        where,
        orderBy: [
          { filePath: "asc" },
          { lineNumber: "asc" },
        ],
        take: limit,
        skip: offset,
      }),
      db.reviewComment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching review comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch review comments" },
      { status: 500 }
    );
  }
}
