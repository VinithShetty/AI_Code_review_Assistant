import { existsSync, readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { createGitHubAppJwt, getGitHubAppIssuer } from "@/lib/github-app";

export const runtime = "nodejs";

type GitHubAppResponse = {
  id: number;
  slug: string;
  name: string;
};

type GitHubInstallationResponse = {
  id: number;
  app_id: number;
  account: { login: string; type: string };
};

async function ghAppFetch<T>(endpoint: string, jwt: string): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-code-review-assistant",
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `GitHub API error (${response.status}) for ${endpoint}: ${text || response.statusText}`
    );
  }

  return JSON.parse(text) as T;
}

function decodeJwtPart(part: string): unknown {
  // JWT uses base64url without padding.
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const json = Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(json) as unknown;
}

function safeKeyInfoFromEnv(): {
  hasInlineKey: boolean;
  keyPath?: string;
  keyPathExists?: boolean;
  keyFirstLine?: string;
} {
  const hasInlineKey = Boolean(process.env.GITHUB_APP_PRIVATE_KEY?.trim());
  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH?.trim();
  if (!keyPath) return { hasInlineKey };

  const keyPathExists = existsSync(keyPath);
  let keyFirstLine: string | undefined;
  if (keyPathExists) {
    try {
      keyFirstLine = readFileSync(keyPath, "utf8").split(/\r?\n/)[0]?.trim();
    } catch {
      // ignore
    }
  }

  return { hasInlineKey, keyPath, keyPathExists, keyFirstLine };
}

// GET /api/github/app/status?installationId=123
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installationIdRaw = searchParams.get("installationId");

  try {
    const jwt = createGitHubAppJwt();
    const [headerPart, payloadPart] = jwt.split(".");

    const diagnostics = {
      issuer: getGitHubAppIssuer(),
      env: {
        hasAppId: Boolean(process.env.GITHUB_APP_ID?.trim()),
        hasClientId: Boolean(process.env.GITHUB_APP_CLIENT_ID?.trim()),
        hasDefaultInstallationId: Boolean(
          process.env.GITHUB_DEFAULT_INSTALLATION_ID?.trim()
        ),
      },
      key: safeKeyInfoFromEnv(),
      jwt: {
        header: headerPart ? decodeJwtPart(headerPart) : undefined,
        payload: payloadPart ? decodeJwtPart(payloadPart) : undefined,
      },
    };

    const app = await ghAppFetch<GitHubAppResponse>("/app", jwt);

    if (!installationIdRaw) {
      return NextResponse.json({ ok: true, app, diagnostics });
    }

    const installationId = Number(installationIdRaw);
    if (!Number.isFinite(installationId) || installationId <= 0) {
      return NextResponse.json(
        { ok: false, error: "installationId must be a positive number" },
        { status: 400 }
      );
    }

    const installation = await ghAppFetch<GitHubInstallationResponse>(
      `/app/installations/${installationId}`,
      jwt
    );

    return NextResponse.json({
      ok: true,
      app,
      diagnostics,
      installation: {
        id: installation.id,
        appId: installation.app_id,
        accountLogin: installation.account?.login,
        accountType: installation.account?.type,
      },
      matchesApp: installation.app_id === app.id,
    });
  } catch (error) {
    console.error("GitHub App status check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint:
          "If you see 'Integration not found', verify GITHUB_APP_CLIENT_ID (recommended) or GITHUB_APP_ID matches the private key you downloaded for this app.",
        env: {
          hasAppId: Boolean(process.env.GITHUB_APP_ID?.trim()),
          hasClientId: Boolean(process.env.GITHUB_APP_CLIENT_ID?.trim()),
          hasPrivateKeyInline: Boolean(process.env.GITHUB_APP_PRIVATE_KEY?.trim()),
          hasPrivateKeyPath: Boolean(process.env.GITHUB_APP_PRIVATE_KEY_PATH?.trim()),
        },
        key: safeKeyInfoFromEnv(),
      },
      { status: 500 }
    );
  }
}
