import { NextRequest, NextResponse } from "next/server";
import { getGitHubInstallationAccessToken } from "@/lib/github-app";

export const runtime = "nodejs";

// GET /api/github/app/token?installationId=123
// For local verification only. Do not expose this publicly.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const installationIdRaw = searchParams.get("installationId");
    const installationId = installationIdRaw ? Number(installationIdRaw) : NaN;

    if (!Number.isFinite(installationId) || installationId <= 0) {
      return NextResponse.json(
        { error: "installationId query param is required" },
        { status: 400 }
      );
    }

    const token = await getGitHubInstallationAccessToken(installationId);
    return NextResponse.json({ ok: true, installationId, tokenLength: token.length });
  } catch (error) {
    console.error("GitHub App token self-test failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
