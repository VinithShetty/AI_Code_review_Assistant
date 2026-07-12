import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserRepos } from "@/lib/github-api";

export const runtime = "nodejs";

// GET /api/github/repos — the SIGNED-IN user's real GitHub repositories,
// fetched live with their OAuth access token.
export async function GET() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  if (!session || !token) {
    return NextResponse.json(
      { error: "Not authenticated", hint: "Sign in with GitHub first." },
      { status: 401 }
    );
  }

  try {
    const repos = await getUserRepos(token);
    const repositories = repos.map((r) => ({
      id: String(r.id),
      fullName: r.full_name,
      name: r.name,
      description: r.description,
      language: r.language,
      isPrivate: r.private,
      stars: r.stargazers_count ?? 0,
      openPrs: r.open_issues_count ?? 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      ownerLogin: r.owner?.login,
      ownerAvatarUrl: r.owner?.avatar_url,
    }));

    return NextResponse.json({ repositories, total: repositories.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch your GitHub repositories",
        details: message,
        hint:
          "The 'repo' scope was just added. Sign out and sign in again to refresh your GitHub access token, then retry.",
      },
      { status: 502 }
    );
  }
}
