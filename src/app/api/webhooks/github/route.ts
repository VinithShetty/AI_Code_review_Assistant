import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac } from "crypto";

// POST /api/webhooks/github - GitHub webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("X-Hub-Signature-256");
    const eventType = request.headers.get("X-GitHub-Event");

    // Validate webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = `sha256=${createHmac("sha256", webhookSecret).update(body).digest("hex")}`;

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Handle different event types
    if (eventType === "pull_request") {
      const action = payload.action as string;
      const pr = payload.pull_request as Record<string, unknown> | undefined;

      if (!pr) {
        return NextResponse.json(
          { error: "Missing pull_request in payload" },
          { status: 400 }
        );
      }

      // Handle opened and synchronize actions
      if (action === "opened" || action === "synchronize") {
        return await handlePullRequestEvent(payload, action);
      }

      return NextResponse.json({
        message: `Pull request action '${action}' received but not processed`,
      });
    }

    // Handle ping event (sent when webhook is first configured)
    if (eventType === "ping") {
      return NextResponse.json({ message: "pong" });
    }

    return NextResponse.json({
      message: `Event type '${eventType}' received but not processed`,
    });
  } catch (error) {
    console.error("Error handling GitHub webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handlePullRequestEvent(
  payload: Record<string, unknown>,
  action: string
) {
  const pr = payload.pull_request as Record<string, unknown>;
  const repo = payload.repository as Record<string, unknown>;

  if (!repo) {
    return NextResponse.json(
      { error: "Missing repository in payload" },
      { status: 400 }
    );
  }

  // Find the repository in our database
  const repoFullName = repo.full_name as string;
  const repository = await db.repository.findFirst({
    where: { fullName: repoFullName },
  });

  if (!repository) {
    return NextResponse.json(
      { error: "Repository not connected", fullName: repoFullName },
      { status: 404 }
    );
  }

  // Extract PR details
  const prNumber = pr.number as number;
  const prTitle = pr.title as string;
  const prBody = pr.body as string | null;
  const prUser = pr.user as Record<string, unknown> | null;
  const base = pr.base as Record<string, unknown> | null;
  const head = pr.head as Record<string, unknown> | null;

  const authorLogin = (prUser?.login as string) ?? "unknown";
  const authorAvatar = prUser?.avatar_url as string | null;
  const baseBranch = (base?.ref as string) ?? "main";
  const headBranch = (head?.ref as string) ?? "unknown";

  // Extract changes if available
  const additions = (pr.additions as number) ?? 0;
  const deletions = (pr.deletions as number) ?? 0;
  const changedFiles = (pr.changed_files as number) ?? 0;

  // Create or update the pull request record
  const existingPr = await db.pullRequest.findFirst({
    where: {
      repoId: repository.id,
      githubPrNumber: prNumber,
    },
  });

  let pullRequest;
  if (existingPr) {
    // Update existing PR (for synchronize events)
    pullRequest = await db.pullRequest.update({
      where: { id: existingPr.id },
      data: {
        title: prTitle,
        description: prBody,
        additions,
        deletions,
        changedFiles,
        status: "open",
      },
    });
  } else {
    // Create new PR
    pullRequest = await db.pullRequest.create({
      data: {
        repoId: repository.id,
        githubPrNumber: prNumber,
        title: prTitle,
        description: prBody,
        authorLogin,
        authorAvatar,
        baseBranch,
        headBranch,
        additions,
        deletions,
        changedFiles,
        status: "open",
      },
    });
  }

  // Create a pending review for the PR
  const review = await db.review.create({
    data: {
      prId: pullRequest.id,
      modelUsed: "gpt-4o",
      status: "pending",
    },
  });

  // Log analytics event
  await db.analyticsEvent.create({
    data: {
      eventType: action === "opened" ? "pr_created" : "pr_updated",
      repoId: repository.id,
      metadata: JSON.stringify({
        prId: pullRequest.id,
        prNumber,
        prTitle,
        reviewId: review.id,
        action,
      }),
    },
  });

  return NextResponse.json({
    message: `Pull request ${action} event processed`,
    pullRequest: {
      id: pullRequest.id,
      number: prNumber,
      title: prTitle,
    },
    review: {
      id: review.id,
      status: review.status,
    },
  });
}
