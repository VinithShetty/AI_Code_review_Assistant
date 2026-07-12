import { existsSync, readFileSync } from "fs";
import { sign } from "crypto";

function base64url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePem(pem: string): string {
  // Supports env vars where newlines are encoded as literal \n
  return pem.replace(/\\n/g, "\n").trim();
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getOptionalPositiveNumberEnv(name: string): number | undefined {
  const raw = getOptionalEnv(name);
  if (!raw) return undefined;
  const numberValue = Number(raw);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return numberValue;
}

export function getGitHubAppId(): number {
  const appId = getOptionalPositiveNumberEnv("GITHUB_APP_ID");
  if (!appId) {
    throw new Error(
      "Missing GitHub App identifier. Set GITHUB_APP_CLIENT_ID (recommended) or GITHUB_APP_ID."
    );
  }
  return appId;
}

export function getGitHubAppIssuer(): string {
  // GitHub supports using the GitHub App "Client ID" as the JWT issuer.
  // If present, prefer it; otherwise fall back to numeric App ID.
  const clientId = getOptionalEnv("GITHUB_APP_CLIENT_ID");
  if (clientId) return clientId;

  const appId = getOptionalPositiveNumberEnv("GITHUB_APP_ID");
  if (appId) return String(appId);

  throw new Error(
    "Missing GitHub App identifier. Set GITHUB_APP_CLIENT_ID (recommended) or GITHUB_APP_ID."
  );
}

export function getGitHubAppPrivateKeyPem(): string {
  const inlineKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (inlineKey) return normalizePem(inlineKey);

  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
  if (keyPath) {
    if (!existsSync(keyPath)) {
      throw new Error(
        `GITHUB_APP_PRIVATE_KEY_PATH does not exist: ${keyPath}. Download a private key from your GitHub App settings page and update the path.`
      );
    }
    return normalizePem(readFileSync(keyPath, "utf8"));
  }

  throw new Error(
    "Missing GitHub App private key. Set GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH."
  );
}

export function createGitHubAppJwt(options?: { nowSeconds?: number }): string {
  const issuer = getGitHubAppIssuer();
  const privateKey = getGitHubAppPrivateKeyPem();

  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    // GitHub allows up to 10 minutes; keep it short.
    iat: now - 60,
    exp: now + 9 * 60,
    iss: issuer,
  };

  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;

  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

export async function getGitHubInstallationAccessToken(
  installationId: number
): Promise<string> {
  if (!Number.isFinite(installationId) || installationId <= 0) {
    throw new Error("installationId must be a positive number");
  }

  const jwt = createGitHubAppJwt();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ai-code-review-assistant",
      },
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `GitHub token exchange failed (${response.status}): ${text || response.statusText}`
    );
  }

  const json = JSON.parse(text) as { token?: string };
  if (!json.token) throw new Error("GitHub did not return an installation token");
  return json.token;
}
