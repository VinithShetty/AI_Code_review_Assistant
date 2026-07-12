import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/security/findings - List all security scan findings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const repoId = searchParams.get("repoId");
    const scanType = searchParams.get("scanType");

    const where: Record<string, unknown> = {};
    if (repoId) where.repoId = repoId;
    if (scanType) where.scanType = scanType;

    const [scans, total] = await Promise.all([
      db.securityScan.findMany({
        where,
        include: {
          repository: {
            select: {
              id: true,
              fullName: true,
              name: true,
              language: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.securityScan.count({ where }),
    ]);

    // Parse findings JSON for each scan
    const scansWithFindings = scans.map((scan) => ({
      ...scan,
      findings: scan.findings ? JSON.parse(scan.findings) : [],
    }));

    // Aggregate severity counts across all scans
    const aggregateStats = scans.reduce(
      (acc, scan) => {
        acc.totalIssues += scan.totalIssues;
        acc.critical += scan.critical;
        acc.high += scan.high;
        acc.medium += scan.medium;
        acc.low += scan.low;
        return acc;
      },
      { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );

    return NextResponse.json({
      scans: scansWithFindings,
      aggregateStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error listing security findings:", error);
    return NextResponse.json(
      { error: "Failed to list security findings" },
      { status: 500 }
    );
  }
}
