/**
 * Webhook Service — GitHub pull request event processor
 *
 * Bun-based mini-service that:
 *   - Receives GitHub webhooks on POST /webhook/github
 *   - Validates X-Hub-Signature-256 HMAC-SHA256 signatures
 *   - Processes pull_request events (opened, synchronize actions)
 *   - Stores event data in memory for demo purposes
 *   - Exposes GET /health for readiness checks
 */

// ---------------------------------------------------------------------------
// In-memory event store (demo — no external DB connection)
// ---------------------------------------------------------------------------
interface StoredEvent {
  id: string;
  event: string;
  action: string;
  repository: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  sender: string;
  receivedAt: string;
  raw: unknown;
}

const eventStore: StoredEvent[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a simple unique id */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Verify the X-Hub-Signature-256 header against the raw body using the
 * GITHUB_WEBHOOK_SECRET environment variable.
 *
 * GitHub sends:  sha256=<hex-hmac>
 */
function verifySignature(rawBody: Uint8Array, signatureHeader: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("[webhook] ⚠  GITHUB_WEBHOOK_SECRET not set — skipping signature verification");
    return true; // allow in dev, but warn
  }

  if (!signatureHeader) {
    console.error("[webhook] ✖  Missing X-Hub-Signature-256 header");
    return false;
  }

  const expectedPrefix = "sha256=";
  if (!signatureHeader.startsWith(expectedPrefix)) {
    console.error("[webhook] ✖  Invalid signature format (expected sha256= prefix)");
    return false;
  }

  const hmac = new Bun.CryptoHasher("sha256", secret);
  hmac.update(rawBody);
  const computed = `${expectedPrefix}${hmac.digest("hex")}`;

  // Constant-time comparison to prevent timing attacks
  if (computed.length !== signatureHeader.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }

  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleHealth(): Response {
  return Response.json({
    status: "ok",
    service: "webhook-service",
    version: "1.0.0",
    uptime: process.uptime(),
    eventsStored: eventStore.length,
  });
}

async function handleWebhook(request: Request): Promise<Response> {
  try {
    const buf = await request.arrayBuffer();
    const rawBody = new Uint8Array(buf);
    const signatureHeader = request.headers.get("X-Hub-Signature-256");

    // ---- Signature verification ----
    if (!verifySignature(rawBody, signatureHeader)) {
      console.error("[webhook] ✖  Signature verification failed");
      return new Response("Invalid signature", { status: 403 });
    }

    // ---- Parse JSON body ----
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(new TextDecoder().decode(rawBody));
    } catch {
      console.error("[webhook] ✖  Failed to parse JSON body");
      return new Response("Invalid JSON", { status: 400 });
    }

    const event = request.headers.get("X-GitHub-Event") ?? "unknown";
    const action = (payload.action as string) ?? "unknown";

    // ---- Log every event ----
    console.log(`[webhook] 📩  event=${event}  action=${action}`);

    // ---- Process pull_request events ----
    if (event === "pull_request" && (action === "opened" || action === "synchronize")) {
      const pr = payload.pull_request as Record<string, unknown> | undefined;
      const repo = payload.repository as Record<string, unknown> | undefined;
      const sender = payload.sender as Record<string, unknown> | undefined;

      if (!pr) {
        console.warn("[webhook] ⚠  pull_request event missing pull_request object");
        return new Response("Missing pull_request object", { status: 400 });
      }

      const stored: StoredEvent = {
        id: uid(),
        event,
        action,
        repository: (repo?.full_name as string) ?? "unknown",
        pullRequestNumber: (pr.number as number) ?? 0,
        pullRequestTitle: (pr.title as string) ?? "untitled",
        sender: (sender?.login as string) ?? "unknown",
        receivedAt: new Date().toISOString(),
        raw: payload,
      };

      eventStore.push(stored);
      console.log(
        `[webhook] ✅  PR #${stored.pullRequestNumber} "${stored.pullRequestTitle}" — ${stored.action} in ${stored.repository} by ${stored.sender}`,
      );
    } else {
      // Acknowledge but don't process other events/actions
      console.log(`[webhook] ℹ️  Ignored event=${event} action=${action}`);
    }

    return Response.json({ ok: true, event, action }, { status: 200 });
  } catch (err) {
    console.error("[webhook] 💥  Error handling webhook:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 3030;

Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    try {
      // Health check
      if (url.pathname === "/health" && request.method === "GET") {
        return handleHealth();
      }

      // GitHub webhook endpoint
      if (url.pathname === "/webhook/github" && request.method === "POST") {
        return await handleWebhook(request);
      }

      // 404 for everything else
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      console.error("[webhook] 💥  Unhandled error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`🚀  webhook-service listening on http://localhost:${PORT}`);
console.log(`    GET  /health            — health check`);
console.log(`    POST /webhook/github    — GitHub webhook receiver`);
