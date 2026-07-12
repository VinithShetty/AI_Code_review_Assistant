import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

// POST /api/seed - Seed the database with demo data
// Refuses unless SEED_DEMO === 'true' so the app stays in honest real-data mode.
export async function POST() {
  if (process.env.SEED_DEMO !== "true") {
    return NextResponse.json(
      {
        error:
          "Demo seeding is disabled (real-data mode). Set SEED_DEMO=true to enable.",
      },
      { status: 403 }
    );
  }

  try {
    const result = await seedDatabase();

    return NextResponse.json({
      message: "Database seeded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
