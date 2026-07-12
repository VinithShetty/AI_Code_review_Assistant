// AI Code Review Assistant - AI Review Library
// Uses z-ai-web-dev-sdk for LLM calls (server-side only)

export interface AIReviewComment {
  filePath: string;
  lineNumber?: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "security" | "logic" | "style" | "performance" | "bug" | "best-practice";
  message: string;
  suggestion?: string;
}

export interface AIReviewResult {
  summary: string;
  riskScore: number;
  comments: AIReviewComment[];
  modelUsed: string;
}

/**
 * Review code using the AI (z-ai-web-dev-sdk)
 */
export async function reviewCodeWithAI(
  code: string,
  language: string,
  filePath: string
): Promise<AIReviewResult> {
  const systemPrompt = `You are an expert code reviewer. Analyze the provided code and return a structured JSON review.

Your response MUST be valid JSON with this exact structure:
{
  "summary": "A brief summary of the code review findings",
  "riskScore": <number between 1.0 and 10.0>,
  "comments": [
    {
      "filePath": "path/to/file",
      "lineNumber": <line number or null>,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "category": "security" | "logic" | "style" | "performance" | "bug" | "best-practice",
      "message": "Description of the issue",
      "suggestion": "Suggested fix or improvement"
    }
  ]
}

Guidelines:
- riskScore: 1-3 = low risk, 4-6 = medium risk, 7-10 = high risk
- severity: critical = security vulnerabilities or data loss risks, high = significant bugs or security concerns, medium = code quality issues, low = minor improvements, info = informational notes
- Focus on real issues, not style preferences unless they affect correctness
- Provide actionable suggestions for each issue
- Consider the programming language context`;

  const userPrompt = `Review the following ${language} code from "${filePath}":

\`\`\`${language}
${code}
\`\`\`

Provide a thorough code review focusing on:
1. Security vulnerabilities (injection, XSS, auth issues, etc.)
2. Logic errors and potential bugs
3. Performance issues
4. Code quality and best practices
5. Error handling

Return ONLY valid JSON, no additional text.`;

  try {
    // Use z-ai-web-dev-sdk (default export is the ZAI class).
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    // Extract the content from the response
    const content =
      response.choices?.[0]?.message?.content ??
      response?.content ??
      (typeof response === "string" ? response : null);

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response
    let parsed: AIReviewResult;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, create a fallback result
      parsed = {
        summary: content.substring(0, 500),
        riskScore: 5.0,
        comments: [],
        modelUsed: "gpt-4o",
      };
    }

    // Ensure the filePath is set on all comments
    parsed.comments = parsed.comments.map((comment: AIReviewComment) => ({
      ...comment,
      filePath: comment.filePath || filePath,
    }));

    parsed.modelUsed = "gpt-4o";

    return parsed;
  } catch (error) {
    console.error("Error calling AI for code review:", error);

    // Fallback: return a basic analysis
    return {
      summary: `AI review could not be completed. Error: ${error instanceof Error ? error.message : "Unknown error"}. Manual review recommended.`,
      riskScore: 5.0,
      comments: [
        {
          filePath,
          severity: "info",
          category: "best-practice",
          message: "Automated AI review could not be completed. Please perform a manual code review.",
          suggestion: "Retry the AI review or conduct a thorough manual review.",
        },
      ],
      modelUsed: "gpt-4o",
    };
  }
}
