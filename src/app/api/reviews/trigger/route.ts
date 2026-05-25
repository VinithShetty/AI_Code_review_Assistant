import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reviews/trigger - Manually trigger a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prId } = body;

    if (!prId || typeof prId !== "string") {
      return NextResponse.json(
        { error: "prId is required" },
        { status: 400 }
      );
    }

    // Verify PR exists
    const pullRequest = await db.pullRequest.findUnique({
      where: { id: prId },
      include: {
        repository: true,
        reviews: {
          where: { status: { in: ["pending", "in_progress"] } },
        },
      },
    });

    if (!pullRequest) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    // Check if there's already a pending or in-progress review
    if (pullRequest.reviews.length > 0) {
      return NextResponse.json(
        {
          error: "A review is already in progress for this PR",
          existingReview: pullRequest.reviews[0],
        },
        { status: 409 }
      );
    }

    // Create a review record with status "pending"
    const review = await db.review.create({
      data: {
        prId,
        modelUsed: "gpt-4o",
        status: "pending",
        summary: null,
        riskScore: null,
        rawOutput: null,
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        eventType: "review_triggered",
        userId: pullRequest.repository.ownerId,
        repoId: pullRequest.repoId,
        metadata: JSON.stringify({
          reviewId: review.id,
          prId,
          prTitle: pullRequest.title,
        }),
      },
    });

    // Trigger the AI review process asynchronously
    // In production, this would be a background job or queue
    triggerAIReviewAsync(review.id, pullRequest).catch((error) => {
      console.error("Async review trigger failed:", error);
    });

    return NextResponse.json(
      {
        message: "Review triggered successfully",
        review: {
          id: review.id,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error triggering review:", error);
    return NextResponse.json(
      { error: "Failed to trigger review" },
      { status: 500 }
    );
  }
}

/**
 * Asynchronously process the AI review.
 * In production, this would be handled by a background job queue.
 */
async function triggerAIReviewAsync(
  reviewId: string,
  pullRequest: Awaited<ReturnType<typeof db.pullRequest.findUnique>> & NonNullable<unknown>
) {
  try {
    // Update status to in_progress
    await db.review.update({
      where: { id: reviewId },
      data: { status: "in_progress" },
    });

    // Simulate AI review processing
    // In a real implementation, this would:
    // 1. Fetch the PR diff from GitHub
    // 2. Send the code to the AI for review
    // 3. Parse the AI response into structured comments
    // 4. Create ReviewComment records

    const pr = pullRequest as {
      title: string;
      description: string | null;
      additions: number;
      deletions: number;
      changedFiles: number;
    };

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate a mock review result
    const riskScore = Math.round((Math.random() * 8 + 1) * 10) / 10;
    const summary = `AI review completed for PR "${pr.title}". Analyzed ${pr.changedFiles} files with ${pr.additions} additions and ${pr.deletions} deletions. Overall risk assessment: ${riskScore <= 3 ? "Low" : riskScore <= 6 ? "Medium" : "High"}.`;

    await db.review.update({
      where: { id: reviewId },
      data: {
        status: "completed",
        summary,
        riskScore,
        rawOutput: JSON.stringify({
          triggeredAt: new Date().toISOString(),
          filesAnalyzed: pr.changedFiles,
          autoReviewed: true,
        }),
      },
    });
  } catch (error) {
    console.error("Error in async AI review:", error);
    await db.review.update({
      where: { id: reviewId },
      data: {
        status: "failed",
        summary: "Review processing failed. Please try again.",
        rawOutput: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          failedAt: new Date().toISOString(),
        }),
      },
    });
  }
}
