import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews/[id] - Single review with all comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await db.review.findUnique({
      where: { id },
      include: {
        pullRequest: {
          include: {
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
        comments: {
          orderBy: [
            { filePath: "asc" },
            { lineNumber: "asc" },
          ],
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Compute summary stats from comments
    const severityCounts = review.comments.reduce(
      (acc, comment) => {
        acc[comment.severity] = (acc[comment.severity] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const categoryCounts = review.comments.reduce(
      (acc, comment) => {
        acc[comment.category] = (acc[comment.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      review,
      summary: {
        totalComments: review.comments.length,
        severityCounts,
        categoryCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}
