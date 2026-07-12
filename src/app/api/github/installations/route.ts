import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/github/installations
// Returns GitHub App installations recorded via webhook events.
export async function GET() {
  try {
    const installations = await db.gitHubInstallation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ installations });
  } catch (error) {
    console.error("Failed to list installations:", error);
    return NextResponse.json(
      { error: "Failed to list installations" },
      { status: 500 }
    );
  }
}
