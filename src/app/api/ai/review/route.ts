import { NextRequest, NextResponse } from "next/server";

// POST /api/ai/review - AI code review endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, filePath } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "code is required" },
        { status: 400 }
      );
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "language is required" },
        { status: 400 }
      );
    }

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 }
      );
    }

    // Import the SDK dynamically (server-side only)
    const { reviewCodeWithAI } = await import("@/lib/ai-review");
    const result = await reviewCodeWithAI(code, language, filePath);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in AI review:", error);
    return NextResponse.json(
      { error: "Failed to perform AI code review" },
      { status: 500 }
    );
  }
}
