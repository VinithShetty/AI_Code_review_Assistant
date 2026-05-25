import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/repos/[id] - Single repository details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repository = await db.repository.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            login: true,
            name: true,
            avatarUrl: true,
          },
        },
        pullRequests: {
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: {
            reviews: {
              select: {
                id: true,
                status: true,
                riskScore: true,
                modelUsed: true,
                createdAt: true,
              },
            },
          },
        },
        securityScans: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const reviewCount = await db.review.count({
      where: {
        pullRequest: { repoId: id },
      },
    });

    return NextResponse.json({
      repository,
      stats: {
        reviewCount,
        prCount: repository.pullRequests.length,
      },
    });
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

// DELETE /api/repos/[id] - Disconnect repository
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repository = await db.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Delete the repository (cascading will handle related records)
    await db.repository.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Repository disconnected successfully",
      repository: { id, fullName: repository.fullName },
    });
  } catch (error) {
    console.error("Error disconnecting repository:", error);
    return NextResponse.json(
      { error: "Failed to disconnect repository" },
      { status: 500 }
    );
  }
}
