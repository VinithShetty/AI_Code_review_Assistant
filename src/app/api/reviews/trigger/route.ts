import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserPullRequests, getPullRequestFiles } from "@/lib/github-api";
import { reviewCodeWithAI, type AIReviewResult } from "@/lib/ai-review";

export const runtime = "nodejs";

// Bounded review-input size so we never blow the model's context window.
const MAX_REVIEW_CHARS = 12000;

type SessionUser = {
  githubId?: string | number;
  login?: string;
  email?: string | null;
  image?: string | null;
  accessToken?: string;
};

// POST /api/reviews/trigger — run a REAL AI review on a REAL pull request.
// Body: { owner, repo, prNumber }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUser | undefined;
  const token = sessionUser?.accessToken;

  if (!session || !token || !sessionUser?.githubId) {
    return NextResponse.json(
      { error: "Not authenticated", hint: "Sign in with GitHub first." },
      { status: 401 }
    );
  }

  let owner: string;
  let repo: string;
  let prNumber: number;
  try {
    const body = await request.json();
    owner = String(body.owner ?? "").trim();
    repo = String(body.repo ?? "").trim();
    prNumber = Number(body.prNumber);
    if (!owner || !repo || !Number.isInteger(prNumber) || prNumber <= 0) {
      return NextResponse.json(
        { error: "owner, repo and a positive integer prNumber are required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // 1. Find-or-create the current user in our DB.
    const githubId = Number(sessionUser.githubId);
    let user = await db.user.findUnique({ where: { githubId } });
    if (!user) {
      user = await db.user.create({
        data: {
          githubId,
          login: sessionUser.login ?? sessionUser.email?.split("@")[0] ?? "user",
          email: sessionUser.email ?? null,
          avatarUrl: sessionUser.image ?? null,
          accessToken: token,
        },
      });
    }

    // 2. Locate the open PR (also gives us the GitHub repo id + PR metadata).
    const pulls = await getUserPullRequests(token, owner, repo);
    const pr = pulls.find((p) => p.number === prNumber);
    if (!pr || !pr.repo) {
      return NextResponse.json(
        { error: `Open pull request #${prNumber} not found in ${owner}/${repo}` },
        { status: 404 }
      );
    }

    // 3. Upsert the Repository (unique by githubRepoId), owned by this user.
    const repository = await db.repository.upsert({
      where: { githubRepoId: pr.repo.githubRepoId },
      update: {
        ownerId: user.id,
        fullName: pr.repo.fullName,
        name: pr.repo.name,
        description: pr.repo.description,
        language: pr.repo.language,
        isPrivate: pr.repo.isPrivate,
      },
      create: {
        ownerId: user.id,
        githubRepoId: pr.repo.githubRepoId,
        fullName: pr.repo.fullName,
        name: pr.repo.name,
        description: pr.repo.description,
        language: pr.repo.language,
        isPrivate: pr.repo.isPrivate,
      },
    });

    // 4. Fetch changed files and compute real diff stats.
    const files = await getPullRequestFiles(token, owner, repo, prNumber);
    const additions = files.reduce((s, f) => s + (f.additions ?? 0), 0);
    const deletions = files.reduce((s, f) => s + (f.deletions ?? 0), 0);
    const changedFiles = files.length;

    // 5. Upsert the PullRequest (no compound unique in schema → find-then-write).
    const existingPr = await db.pullRequest.findFirst({
      where: { repoId: repository.id, githubPrNumber: prNumber },
    });
    const pullRequest = existingPr
      ? await db.pullRequest.update({
          where: { id: existingPr.id },
          data: {
            title: pr.title,
            description: pr.description,
            authorLogin: pr.authorLogin,
            authorAvatar: pr.authorAvatar,
            baseBranch: pr.baseBranch,
            headBranch: pr.headBranch,
            additions,
            deletions,
            changedFiles,
            status: "open",
          },
        })
      : await db.pullRequest.create({
          data: {
            repoId: repository.id,
            githubPrNumber: prNumber,
            title: pr.title,
            description: pr.description,
            authorLogin: pr.authorLogin,
            authorAvatar: pr.authorAvatar,
            baseBranch: pr.baseBranch,
            headBranch: pr.headBranch,
            additions,
            deletions,
            changedFiles,
            status: "open",
          },
        });

    // 6. Build a bounded review input from the file patches.
    let code = "";
    for (const f of files) {
      // Skip deleted files and binary/patch-less entries.
      if (f.status === "removed" || !f.patch) continue;
      const block = `\n\n// File: ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n${f.patch}`;
      if (code.length + block.length > MAX_REVIEW_CHARS) {
        code += block.slice(0, Math.max(0, MAX_REVIEW_CHARS - code.length));
        break;
      }
      code += block;
    }
    code = code.trim();

    const language = repository.language ?? "text";

    // 7. Run the AI review. reviewCodeWithAI never throws (has an internal
    //    fallback), but guard anyway and store a fallback review on failure.
    let result: AIReviewResult;
    try {
      const input = code || `Pull request #${prNumber} has no reviewable text diff (only deleted or binary files).`;
      result = await reviewCodeWithAI(input, language, `PR #${prNumber}`);
    } catch (aiError) {
      result = {
        summary: `AI review could not be completed. ${aiError instanceof Error ? aiError.message : "Unknown error"}. Manual review recommended.`,
        riskScore: 5.0,
        comments: [],
        modelUsed: "gpt-4o",
      };
    }

    // Normalize the AI's vocabulary + scales to what the schema types + UI use.
    // Severity: the AI emits critical/high/medium/low/info; the app renders
    // critical/error/warning/info (CommentThread). Category: map the AI's extra
    // buckets (bug/best-practice) onto the app's 4. Risk: AI is 1-10, app is 0-100.
    const SEVERITY_MAP: Record<string, string> = {
      critical: "critical", high: "error", medium: "warning", low: "info", info: "info",
    };
    const CATEGORY_MAP: Record<string, string> = {
      security: "security", performance: "performance", logic: "logic",
      style: "style", bug: "logic", "best-practice": "style",
    };
    const riskScore100 =
      result.riskScore <= 10 ? Math.round(result.riskScore * 10) : Math.round(result.riskScore);

    // 8. Persist the Review + its comments.
    const review = await db.review.create({
      data: {
        prId: pullRequest.id,
        modelUsed: result.modelUsed,
        summary: result.summary,
        riskScore: riskScore100,
        status: "completed",
        rawOutput: JSON.stringify(result),
        comments: {
          create: result.comments.map((c) => ({
            filePath: c.filePath,
            lineNumber: c.lineNumber ?? null,
            severity: SEVERITY_MAP[c.severity] ?? "info",
            category: CATEGORY_MAP[c.category] ?? "logic",
            message: c.message,
            suggestion: c.suggestion ?? null,
          })),
        },
      },
    });

    return NextResponse.json({ reviewId: review.id }, { status: 201 });
  } catch (error) {
    console.error("Error triggering review:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to trigger review", details: message },
      { status: 500 }
    );
  }
}
