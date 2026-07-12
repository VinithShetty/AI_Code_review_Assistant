import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scanForSecrets, scanForOWASP } from "@/lib/security-scanner";

// POST /api/security/scan - Run security scan on a repository
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId, code } = body;

    if (!repoId || typeof repoId !== "string") {
      return NextResponse.json(
        { error: "repoId is required" },
        { status: 400 }
      );
    }

    // Verify repository exists
    const repository = await db.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // If code is provided, scan it directly; otherwise scan with a placeholder
    const codeToScan = code ?? "// No code provided for scanning\n";

    // Detect language from repository or default
    const language = repository.language?.toLowerCase() ?? "javascript";

    // Run secret scanner
    const secretFindings = scanForSecrets(codeToScan, repository.fullName);

    // Run OWASP scanner
    const owaspFindings = scanForOWASP(codeToScan, repository.fullName, language);

    // Combine findings
    const allFindings = [
      ...secretFindings.map((f) => ({
        ...f,
        type: "secret" as const,
      })),
      ...owaspFindings.map((f) => ({
        ...f,
        type: "owasp" as const,
      })),
    ];

    // Count by severity
    const critical = allFindings.filter((f) => f.severity === "critical").length;
    const high = allFindings.filter((f) => f.severity === "high").length;
    const medium = allFindings.filter((f) => f.severity === "medium").length;
    const low = allFindings.filter((f) => f.severity === "low").length;
    const totalIssues = allFindings.length;

    // Create security scan record
    const securityScan = await db.securityScan.create({
      data: {
        repoId,
        scanType: "full",
        findings: JSON.stringify(allFindings),
        totalIssues,
        critical,
        high,
        medium,
        low,
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        eventType: "security_scan",
        repoId,
        metadata: JSON.stringify({
          scanId: securityScan.id,
          totalIssues,
          critical,
          high,
          medium,
          low,
        }),
      },
    });

    return NextResponse.json({
      scan: {
        id: securityScan.id,
        scanType: securityScan.scanType,
        totalIssues,
        critical,
        high,
        medium,
        low,
        createdAt: securityScan.createdAt,
      },
      findings: allFindings,
    });
  } catch (error) {
    console.error("Error running security scan:", error);
    return NextResponse.json(
      { error: "Failed to run security scan" },
      { status: 500 }
    );
  }
}
