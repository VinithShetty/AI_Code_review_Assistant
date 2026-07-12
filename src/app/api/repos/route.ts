import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRepoByFullName } from "@/lib/github-api";

export const runtime = "nodejs";

// GET /api/repos - List all repositories with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const repositories = await db.repository.findMany({
      include: {
        owner: {
          select: {
            id: true,
            login: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            pullRequests: true,
            securityScans: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get review count per repo
    const reposWithStats = await Promise.all(
      repositories.map(async (repo) => {
        const reviewCount = await db.review.count({
          where: {
            pullRequest: { repoId: repo.id },
          },
        });

        return {
          ...repo,
          stats: {
            prCount: repo._count.pullRequests,
            reviewCount,
            scanCount: repo._count.securityScans,
          },
        };
      })
    );

    const total = await db.repository.count();

    return NextResponse.json({
      repositories: reposWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error listing repositories:", error);
    return NextResponse.json(
      { error: "Failed to list repositories" },
      { status: 500 }
    );
  }
}

// POST /api/repos - Connect a repository
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, installationId: installationIdFromBody } = body as {
      fullName?: unknown;
      installationId?: unknown;
    };

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json(
        { error: "fullName is required" },
        { status: 400 }
      );
    }

    // Check if repo already exists
    const existing = await db.repository.findFirst({
      where: { fullName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Repository already connected", repository: existing },
        { status: 409 }
      );
    }

    // Parse the full name to get owner and name
    const parts = fullName.split("/");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid repository fullName. Expected format: 'owner/repo'" },
        { status: 400 }
      );
    }

    const [ownerName, repoName] = parts;

    // Determine installation id
    let installationId: number | null = null;
    if (typeof installationIdFromBody === "number" && Number.isFinite(installationIdFromBody)) {
      installationId = installationIdFromBody;
    } else {
      const installation = await db.gitHubInstallation.findFirst({
        where: { accountLogin: ownerName },
        orderBy: { updatedAt: "desc" },
      });
      installationId = installation?.installationId ?? null;

      if (!installationId) {
        const fallback = process.env.GITHUB_DEFAULT_INSTALLATION_ID;
        if (fallback) {
          const parsed = Number(fallback);
          if (Number.isFinite(parsed) && parsed > 0) installationId = parsed;
        }
      }
    }

    if (!installationId) {
      return NextResponse.json(
        {
          error: "Missing GitHub App installationId for this owner.",
          hint:
            "Install your GitHub App on the org/user, ensure installation webhooks are delivered to /api/webhooks/github, or pass { installationId } in the request body.",
          owner: ownerName,
        },
        { status: 400 }
      );
    }

    // Fetch repo details from GitHub using the GitHub App installation token
    const ghRepo = await getRepoByFullName({
      installationId,
      owner: ownerName,
      repo: repoName,
    });

    // Find or create a default owner user
    let owner = await db.user.findFirst({
      where: { login: ownerName },
    });

    if (!owner) {
      owner = await db.user.create({
        data: {
          githubId: Math.floor(Math.random() * 1000000),
          login: ownerName,
          name: ownerName,
        },
      });
    }

    const repository = await db.repository.create({
      data: {
        ownerId: owner.id,
        githubRepoId: ghRepo.id,
        githubInstallationId: installationId,
        fullName: ghRepo.full_name,
        name: ghRepo.name,
        description: ghRepo.description ?? `Connected repository: ${ghRepo.full_name}`,
        language: ghRepo.language,
        isPrivate: ghRepo.private,
        stars: ghRepo.stargazers_count ?? 0,
        openPrs: 0,
      },
      include: {
        owner: {
          select: {
            id: true,
            login: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ repository }, { status: 201 });
  } catch (error) {
    console.error("Error connecting repository:", error);
    return NextResponse.json(
      {
        error: "Failed to connect repository",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
