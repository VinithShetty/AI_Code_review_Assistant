import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserPullRequests } from "@/lib/github-api";

export const runtime = "nodejs";

// GET /api/github/repos/[owner]/[repo]/pulls — the repo's open pull requests,
// fetched live with the signed-in user's OAuth access token.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  if (!session || !token) {
    return NextResponse.json(
      { error: "Not authenticated", hint: "Sign in with GitHub first." },
      { status: 401 }
    );
  }

  const { owner, repo } = await params;

  try {
    const pulls = await getUserPullRequests(token, owner, repo);
    const pullRequests = pulls.map((p) => ({
      number: p.number,
      title: p.title,
      authorLogin: p.authorLogin,
      changedFiles: p.changedFiles,
      additions: p.additions,
      deletions: p.deletions,
      htmlUrl: p.htmlUrl,
    }));

    return NextResponse.json({ pullRequests, total: pullRequests.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch pull requests", details: message },
      { status: 502 }
    );
  }
}
