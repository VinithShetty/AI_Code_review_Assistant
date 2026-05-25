import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/prs/[id] - Single PR detail with reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pullRequest = await db.pullRequest.findUnique({
      where: { id },
      include: {
        repository: {
          select: {
            id: true,
            fullName: true,
            name: true,
            language: true,
            stars: true,
          },
        },
        reviews: {
          include: {
            comments: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pullRequest) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ pullRequest });
  } catch (error) {
    console.error("Error fetching pull request:", error);
    return NextResponse.json(
      { error: "Failed to fetch pull request" },
      { status: 500 }
    );
  }
}
