// AI Code Review Assistant - Seed Data Script

import { db } from "@/lib/db";

export async function seedDatabase() {
  // Real-data mode by default. The fake demo data below is only created when
  // SEED_DEMO === 'true'. This keeps the app honest: a fresh account shows
  // empty states until real reviews are run. The seeding code is preserved
  // behind the flag so it can be re-enabled for local demos.
  if (process.env.SEED_DEMO !== "true") {
    console.log(
      "Demo seed disabled (real-data mode). Set SEED_DEMO=true to enable."
    );
    return { disabled: true } as const;
  }

  // Clean existing data (in reverse dependency order)
  await db.analyticsEvent.deleteMany();
  await db.securityScan.deleteMany();
  await db.reviewComment.deleteMany();
  await db.review.deleteMany();
  await db.pullRequest.deleteMany();
  await db.repository.deleteMany();
  await db.user.deleteMany();

  // Create demo users
  const user1 = await db.user.create({
    data: {
      githubId: 1001,
      login: "sarah-chen",
      email: "sarah.chen@example.com",
      name: "Sarah Chen",
      avatarUrl: "https://avatars.githubusercontent.com/u/1001",
      accessToken: "ghp_demo_token_sarah_1001",
    },
  });

  const user2 = await db.user.create({
    data: {
      githubId: 2002,
      login: "alex-rivera",
      email: "alex.rivera@example.com",
      name: "Alex Rivera",
      avatarUrl: "https://avatars.githubusercontent.com/u/2002",
      accessToken: "ghp_demo_token_alex_2002",
    },
  });

  // Create repositories
  const repo1 = await db.repository.create({
    data: {
      ownerId: user1.id,
      githubRepoId: 1,
      fullName: "vercel/next.js",
      name: "next.js",
      description: "The React Framework for the Web",
      language: "TypeScript",
      isPrivate: false,
      stars: 124000,
      openPrs: 142,
    },
  });

  const repo2 = await db.repository.create({
    data: {
      ownerId: user1.id,
      githubRepoId: 2,
      fullName: "facebook/react",
      name: "react",
      description: "The library for web and native user interfaces",
      language: "JavaScript",
      isPrivate: false,
      stars: 225000,
      openPrs: 890,
    },
  });

  const repo3 = await db.repository.create({
    data: {
      ownerId: user2.id,
      githubRepoId: 3,
      fullName: "denoland/deno",
      name: "deno",
      description: "A modern runtime for JavaScript and TypeScript",
      language: "Rust",
      isPrivate: false,
      stars: 94000,
      openPrs: 234,
    },
  });

  const repo4 = await db.repository.create({
    data: {
      ownerId: user2.id,
      githubRepoId: 4,
      fullName: "openai/tiktoken",
      name: "tiktoken",
      description: "A fast BPE tokeniser for use with OpenAI models",
      language: "Python",
      isPrivate: false,
      stars: 12000,
      openPrs: 28,
    },
  });

  const repo5 = await db.repository.create({
    data: {
      ownerId: user1.id,
      githubRepoId: 5,
      fullName: "langchain-ai/langchain",
      name: "langchain",
      description: "Build context-aware reasoning applications",
      language: "Python",
      isPrivate: false,
      stars: 92000,
      openPrs: 567,
    },
  });

  // Create pull requests
  const pr1 = await db.pullRequest.create({
    data: {
      repoId: repo1.id,
      githubPrNumber: 52341,
      title: "feat: implement streaming SSR with suspense boundaries",
      description:
        "Adds support for streaming SSR with built-in suspense boundary handling. This enables progressive page rendering and improved TTFB metrics.",
      authorLogin: "sarah-chen",
      authorAvatar: "https://avatars.githubusercontent.com/u/1001",
      baseBranch: "main",
      headBranch: "feat/streaming-ssr",
      additions: 1247,
      deletions: 389,
      changedFiles: 23,
      status: "open",
    },
  });

  const pr2 = await db.pullRequest.create({
    data: {
      repoId: repo2.id,
      githubPrNumber: 28456,
      title: "fix: resolve memory leak in useEffect cleanup with concurrent mode",
      description:
        "Fixes a critical memory leak that occurs when components with useEffect hooks are unmounted during concurrent rendering. The cleanup function was not being called in certain edge cases.",
      authorLogin: "alex-rivera",
      authorAvatar: "https://avatars.githubusercontent.com/u/2002",
      baseBranch: "main",
      headBranch: "fix/concurrent-useeffect-leak",
      additions: 156,
      deletions: 42,
      changedFiles: 5,
      status: "merged",
    },
  });

  const pr3 = await db.pullRequest.create({
    data: {
      repoId: repo3.id,
      githubPrNumber: 19832,
      title: "feat: add WebSocket support for HMR in dev server",
      description:
        "Implements WebSocket-based hot module replacement for the Deno dev server, replacing the previous polling-based approach. Reduces reload latency by ~300ms.",
      authorLogin: "sarah-chen",
      authorAvatar: "https://avatars.githubusercontent.com/u/1001",
      baseBranch: "main",
      headBranch: "feat/ws-hmr",
      additions: 834,
      deletions: 215,
      changedFiles: 12,
      status: "open",
    },
  });

  const pr4 = await db.pullRequest.create({
    data: {
      repoId: repo4.id,
      githubPrNumber: 421,
      title: "perf: optimize BPE token encoding with SIMD instructions",
      description:
        "Leverages SIMD instructions for faster byte-pair encoding on supported platforms. Benchmarks show 2.3x improvement on large text inputs.",
      authorLogin: "alex-rivera",
      authorAvatar: "https://avatars.githubusercontent.com/u/2002",
      baseBranch: "main",
      headBranch: "perf/simd-encoding",
      additions: 567,
      deletions: 123,
      changedFiles: 8,
      status: "open",
    },
  });

  const pr5 = await db.pullRequest.create({
    data: {
      repoId: repo5.id,
      githubPrNumber: 15324,
      title: "feat: add RAG pipeline with vector store integration",
      description:
        "Implements a complete Retrieval-Augmented Generation pipeline with support for multiple vector stores (Pinecone, Weaviate, Chroma). Includes document chunking, embedding, and retrieval strategies.",
      authorLogin: "sarah-chen",
      authorAvatar: "https://avatars.githubusercontent.com/u/1001",
      baseBranch: "main",
      headBranch: "feat/rag-pipeline",
      additions: 2341,
      deletions: 156,
      changedFiles: 34,
      status: "open",
    },
  });

  const pr6 = await db.pullRequest.create({
    data: {
      repoId: repo1.id,
      githubPrNumber: 52342,
      title: "fix: handle edge case in dynamic route parameter encoding",
      description:
        "Fixes an issue where dynamic route parameters containing special characters were not properly encoded, leading to 404 errors for routes with unicode characters.",
      authorLogin: "alex-rivera",
      authorAvatar: "https://avatars.githubusercontent.com/u/2002",
      baseBranch: "canary",
      headBranch: "fix/route-encoding",
      additions: 45,
      deletions: 12,
      changedFiles: 3,
      status: "closed",
    },
  });

  const pr7 = await db.pullRequest.create({
    data: {
      repoId: repo2.id,
      githubPrNumber: 28457,
      title: "refactor: modernize reconciler with scheduler priority lanes",
      description:
        "Refactors the reconciler to use scheduler priority lanes for better task scheduling. This prepares the codebase for the upcoming async rendering improvements.",
      authorLogin: "sarah-chen",
      authorAvatar: "https://avatars.githubusercontent.com/u/1001",
      baseBranch: "main",
      headBranch: "refactor/priority-lanes",
      additions: 892,
      deletions: 674,
      changedFiles: 18,
      status: "open",
    },
  });

  const pr8 = await db.pullRequest.create({
    data: {
      repoId: repo5.id,
      githubPrNumber: 15325,
      title: "fix: prevent tool execution timeout from hanging agent loop",
      description:
        "Fixes a bug where tool execution timeouts would cause the agent loop to hang indefinitely. Now properly propagates timeout errors and allows the agent to recover.",
      authorLogin: "alex-rivera",
      authorAvatar: "https://avatars.githubusercontent.com/u/2002",
      baseBranch: "main",
      headBranch: "fix/tool-timeout",
      additions: 78,
      deletions: 23,
      changedFiles: 4,
      status: "merged",
    },
  });

  const pr9 = await db.pullRequest.create({
    data: {
      repoId: repo3.id,
      githubPrNumber: 19833,
      title: "chore: upgrade to Rust 2024 edition and update dependencies",
      description:
        "Updates the project to use Rust 2024 edition and bumps all dependencies to their latest compatible versions. No breaking changes.",
      authorLogin: "sarah-chen",
      authorAvatar: "https://avatars.githubusercontent.com/u/1001",
      baseBranch: "main",
      headBranch: "chore/rust-2024",
      additions: 234,
      deletions: 198,
      changedFiles: 15,
      status: "merged",
    },
  });

  const pr10 = await db.pullRequest.create({
    data: {
      repoId: repo4.id,
      githubPrNumber: 422,
      title: "feat: add support for o200k_base encoding model",
      description:
        "Adds support for the new o200k_base encoding model used by GPT-4o and later models. Includes comprehensive test coverage.",
      authorLogin: "alex-rivera",
      authorAvatar: "https://avatars.githubusercontent.com/u/2002",
      baseBranch: "main",
      headBranch: "feat/o200k-encoding",
      additions: 412,
      deletions: 56,
      changedFiles: 7,
      status: "open",
    },
  });

  // Create reviews
  const review1 = await db.review.create({
    data: {
      prId: pr1.id,
      modelUsed: "gpt-4o",
      summary:
        "This PR implements streaming SSR with suspense boundaries. The implementation is solid overall with good test coverage. Key concerns: some error boundary edge cases need handling, and the streaming protocol should be documented more thoroughly. Risk is moderate due to the scope of changes across 23 files.",
      riskScore: 6.2,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Good implementation with some concerns",
        filesReviewed: 23,
        issuesFound: 4,
        recommendations: [
          "Add error boundary tests for streaming failures",
          "Document the streaming protocol",
          "Consider adding a fallback for older browsers",
        ],
      }),
    },
  });

  const review2 = await db.review.create({
    data: {
      prId: pr2.id,
      modelUsed: "gpt-4o",
      summary:
        "Critical memory leak fix for concurrent mode. The solution correctly addresses the cleanup race condition by using a ref-based approach. Minor style concerns but overall this is a well-targeted fix with proper regression tests.",
      riskScore: 2.8,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Well-targeted fix with proper testing",
        filesReviewed: 5,
        issuesFound: 1,
        recommendations: ["Consider adding a comment explaining the ref-based cleanup pattern"],
      }),
    },
  });

  const review3 = await db.review.create({
    data: {
      prId: pr3.id,
      modelUsed: "claude-3.5-sonnet",
      summary:
        "WebSocket HMR implementation is well-structured. The connection management and reconnection logic is robust. Found potential issues with concurrent file change events and missing cleanup in edge cases. Security review needed for WebSocket origin validation.",
      riskScore: 5.5,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Solid implementation with security concerns",
        filesReviewed: 12,
        issuesFound: 3,
        recommendations: [
          "Add WebSocket origin validation",
          "Implement rate limiting for HMR events",
          "Add connection state recovery",
        ],
      }),
    },
  });

  const review4 = await db.review.create({
    data: {
      prId: pr5.id,
      modelUsed: "gpt-4o",
      summary:
        "Large PR with RAG pipeline implementation. Architecture is well-designed with good separation of concerns. Several security and performance issues detected: SQL injection risk in document queries, missing input validation, and potential memory issues with large document sets.",
      riskScore: 7.8,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Good architecture with critical security issues",
        filesReviewed: 34,
        issuesFound: 6,
        recommendations: [
          "Fix SQL injection in document queries immediately",
          "Add input validation for document uploads",
          "Implement pagination for large result sets",
          "Add rate limiting for embedding API calls",
          "Consider streaming for large document processing",
          "Add circuit breaker for vector store operations",
        ],
      }),
    },
  });

  const review5 = await db.review.create({
    data: {
      prId: pr4.id,
      modelUsed: "claude-3.5-sonnet",
      summary: "Review in progress for SIMD optimization PR.",
      riskScore: null,
      status: "pending",
      rawOutput: null,
    },
  });

  const review6 = await db.review.create({
    data: {
      prId: pr7.id,
      modelUsed: "gpt-4o",
      summary:
        "Reconciler refactoring is significant but well-structured. The priority lane implementation follows the scheduler RFC. Performance benchmarks show improvement. Some concerns about backward compatibility with existing concurrent features.",
      riskScore: 4.5,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Well-structured refactoring with compatibility concerns",
        filesReviewed: 18,
        issuesFound: 2,
        recommendations: [
          "Add backward compatibility tests",
          "Document migration guide for custom schedulers",
        ],
      }),
    },
  });

  const review7 = await db.review.create({
    data: {
      prId: pr8.id,
      modelUsed: "claude-3.5-sonnet",
      summary:
        "Small but critical fix for tool execution timeouts. The error propagation pattern is correct. Test coverage is adequate. No significant concerns.",
      riskScore: 1.5,
      status: "completed",
      rawOutput: JSON.stringify({
        overallAssessment: "Clean fix with adequate testing",
        filesReviewed: 4,
        issuesFound: 0,
        recommendations: [],
      }),
    },
  });

  const review8 = await db.review.create({
    data: {
      prId: pr10.id,
      modelUsed: "gpt-4o",
      summary: "Review failed due to processing timeout. Please retry.",
      riskScore: null,
      status: "failed",
      rawOutput: null,
    },
  });

  // Create review comments
  const comments = [
    // Review 1 comments (Streaming SSR PR)
    {
      reviewId: review1.id,
      filePath: "packages/next/src/server/streaming/renderer.tsx",
      lineNumber: 142,
      severity: "high",
      category: "logic",
      message:
        "The error boundary fallback is not properly propagated when streaming fails mid-response. This can leave the client in an inconsistent state.",
      suggestion:
        "Add a catch handler that sends a proper error boundary fallback through the stream before closing.",
    },
    {
      reviewId: review1.id,
      filePath: "packages/next/src/server/streaming/protocol.ts",
      lineNumber: 45,
      severity: "medium",
      category: "style",
      message: "Magic numbers used for stream protocol identifiers. Consider defining constants for better readability.",
      suggestion:
        "Define protocol constants: `const STREAM_CHUNK = 0x01; const STREAM_ERROR = 0x02; const STREAM_COMPLETE = 0x03;`",
    },
    {
      reviewId: review1.id,
      filePath: "packages/next/src/server/streaming/renderer.tsx",
      lineNumber: 289,
      severity: "high",
      category: "security",
      message:
        "No Content-Type validation on streamed chunks. Malformed content could be injected into the response stream.",
      suggestion:
        "Add Content-Type validation headers before streaming each chunk and sanitize any HTML content.",
    },
    {
      reviewId: review1.id,
      filePath: "test/streaming/ssr-streaming.test.ts",
      lineNumber: 67,
      severity: "low",
      category: "style",
      message: "Test description could be more specific about what edge case is being tested.",
      suggestion:
        'Change from "handles errors" to "handles mid-stream render errors and sends error boundary fallback"',
    },
    // Review 2 comments (Memory leak fix)
    {
      reviewId: review2.id,
      filePath: "packages/react-reconciler/src/ReactFiberWorkLoop.js",
      lineNumber: 2345,
      severity: "medium",
      category: "style",
      message:
        "The ref-based cleanup pattern is non-obvious. A comment explaining why a ref is used instead of a closure would help future maintainers.",
      suggestion:
        "// We use a ref here instead of a closure because the cleanup function must always reference the latest mounted instance, even when called after unmount during concurrent rendering.",
    },
    // Review 3 comments (WebSocket HMR)
    {
      reviewId: review3.id,
      filePath: "src/dev/hmr/websocket.ts",
      lineNumber: 23,
      severity: "critical",
      category: "security",
      message:
        "No origin validation on WebSocket connections. This could allow malicious sites to connect to the dev server's HMR websocket.",
      suggestion:
        "Add origin validation: `if (request.headers.origin !== allowedOrigin) { ws.close(403, 'Origin not allowed'); return; }`",
    },
    {
      reviewId: review3.id,
      filePath: "src/dev/hmr/websocket.ts",
      lineNumber: 87,
      severity: "medium",
      category: "logic",
      message:
        "Concurrent file change events may cause race conditions in the debounced update handler. Multiple rapid changes could skip intermediate states.",
      suggestion:
        "Use a queue-based approach where file changes are processed sequentially, or add a mutex lock around the update logic.",
    },
    {
      reviewId: review3.id,
      filePath: "src/dev/hmr/client.ts",
      lineNumber: 156,
      severity: "low",
      category: "performance",
      message:
        "Reconnection exponential backoff could accumulate to very long wait times. Consider capping the maximum retry interval.",
      suggestion:
        "Add a max backoff cap: `const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000); // 30s max`",
    },
    // Review 4 comments (RAG pipeline - security issues)
    {
      reviewId: review4.id,
      filePath: "langchain/retrievers/vector_store.py",
      lineNumber: 78,
      severity: "critical",
      category: "security",
      message:
        "SQL injection vulnerability: user-controlled query string is directly interpolated into the SQL query used for similarity search.",
      suggestion:
        "Use parameterized queries: `cursor.execute('SELECT * FROM documents WHERE embedding <=> %s LIMIT %s', (query_embedding, limit))`",
    },
    {
      reviewId: review4.id,
      filePath: "langchain/document_loaders/base.py",
      lineNumber: 34,
      severity: "high",
      category: "security",
      message:
        "No file type validation on document uploads. Malicious files could be processed, potentially leading to server-side code execution.",
      suggestion:
        "Add file type allowlist validation: `ALLOWED_TYPES = {'.txt', '.pdf', '.md', '.html'}; assert Path(file).suffix in ALLOWED_TYPES`",
    },
    {
      reviewId: review4.id,
      filePath: "langchain/chains/rag.py",
      lineNumber: 123,
      severity: "high",
      category: "logic",
      message:
        "No pagination on vector store queries. Large result sets could cause memory issues and slow response times.",
      suggestion:
        "Implement cursor-based pagination with a default page size: `results = vector_store.similarity_search(query, k=min(limit, 100))`",
    },
    {
      reviewId: review4.id,
      filePath: "langchain/embeddings/openai.py",
      lineNumber: 56,
      severity: "medium",
      category: "performance",
      message:
        "No rate limiting on embedding API calls. Bulk document ingestion could exceed API rate limits.",
      suggestion:
        "Implement exponential backoff with rate limiting: add `tenacity` retry decorator with `@retry(wait=wait_exponential(min=1, max=60), stop=stop_after_attempt(5))`",
    },
    {
      reviewId: review4.id,
      filePath: "langchain/retrievers/vector_store.py",
      lineNumber: 200,
      severity: "medium",
      category: "logic",
      message:
        "Circuit breaker pattern is missing for vector store operations. Prolonged outages could cascade to the entire RAG pipeline.",
      suggestion:
        "Implement a circuit breaker that opens after N consecutive failures and allows retry after a cooldown period.",
    },
    {
      reviewId: review4.id,
      filePath: "langchain/chains/rag.py",
      lineNumber: 89,
      severity: "low",
      category: "style",
      message:
        "The `retrieve` method name is ambiguous. It could benefit from a more descriptive name that indicates it retrieves from a vector store.",
      suggestion:
        "Rename to `retrieve_from_vectorstore` or `semantic_search` for better clarity.",
    },
    // Review 6 comments (Reconciler refactoring)
    {
      reviewId: review6.id,
      filePath: "packages/react-reconciler/src/SchedulerPriorities.js",
      lineNumber: 45,
      severity: "medium",
      category: "logic",
      message:
        "Priority lane mapping does not account for custom scheduler implementations. Users with custom schedulers may experience unexpected behavior.",
      suggestion:
        "Add a priority mapping configuration option and provide a migration guide for custom scheduler users.",
    },
    {
      reviewId: review6.id,
      filePath: "packages/react-reconciler/src/ReactFiberLane.js",
      lineNumber: 112,
      severity: "low",
      category: "performance",
      message:
        "Lane bit operations could be optimized using bitwise operations for better performance in hot paths.",
      suggestion:
        "Use `lanes & ~lane` instead of `lanes & (0b111...1 ^ lane)` for clearing a single lane.",
    },
    // Review 7 comments (Tool timeout fix)
    {
      reviewId: review7.id,
      filePath: "langchain/agents/tool_executor.py",
      lineNumber: 67,
      severity: "low",
      category: "style",
      message:
        "Consider adding a log message when a tool execution times out, for debugging purposes.",
      suggestion:
        "Add: `logger.warning(f'Tool {tool.name} execution timed out after {timeout}s')` before raising the timeout error.",
    },
  ];

  for (const comment of comments) {
    await db.reviewComment.create({ data: comment });
  }

  // Create security scans
  await db.securityScan.create({
    data: {
      repoId: repo1.id,
      scanType: "secrets",
      findings: JSON.stringify([
        {
          type: "GitHub Token",
          filePath: ".env.local",
          lineNumber: 12,
          severity: "critical",
          match: "ghp_...x9k2",
          description: "GitHub personal access token detected",
        },
      ]),
      totalIssues: 1,
      critical: 1,
      high: 0,
      medium: 0,
      low: 0,
    },
  });

  await db.securityScan.create({
    data: {
      repoId: repo5.id,
      scanType: "owasp",
      findings: JSON.stringify([
        {
          owaspId: "A03:2021",
          category: "SQL Injection",
          filePath: "langchain/retrievers/vector_store.py",
          lineNumber: 78,
          severity: "critical",
          message: "SQL injection vulnerability in similarity search",
          suggestion: "Use parameterized queries",
        },
        {
          owaspId: "A07:2021",
          category: "Cross-Site Scripting (XSS)",
          filePath: "langchain/tools/web_browser.py",
          lineNumber: 45,
          severity: "high",
          message: "Unsanitized HTML content rendered to DOM",
          suggestion: "Sanitize HTML with DOMPurify before rendering",
        },
        {
          owaspId: "A02:2021",
          category: "Cryptographic Failures",
          filePath: "langchain/embeddings/base.py",
          lineNumber: 23,
          severity: "medium",
          message: "SSL verification disabled for embedding API calls",
          suggestion: "Never disable SSL verification in production",
        },
      ]),
      totalIssues: 3,
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
    },
  });

  await db.securityScan.create({
    data: {
      repoId: repo3.id,
      scanType: "full",
      findings: JSON.stringify([
        {
          type: "Generic API Key",
          filePath: "src/dev/config.rs",
          lineNumber: 34,
          severity: "high",
          match: "api_...7k2m",
          description: "Generic API key detected",
        },
        {
          owaspId: "A03:2021",
          category: "Command Injection",
          filePath: "src/tools/shell.rs",
          lineNumber: 89,
          severity: "critical",
          message: "Shell command execution with unsanitized input",
          suggestion: "Use allowlist for allowed commands",
        },
      ]),
      totalIssues: 2,
      critical: 1,
      high: 1,
      medium: 0,
      low: 0,
    },
  });

  // Create analytics events
  const analyticsEvents = [
    { eventType: "review_completed", userId: user1.id, repoId: repo1.id, metadata: JSON.stringify({ reviewId: review1.id, riskScore: 6.2 }) },
    { eventType: "review_completed", userId: user2.id, repoId: repo2.id, metadata: JSON.stringify({ reviewId: review2.id, riskScore: 2.8 }) },
    { eventType: "review_completed", userId: user1.id, repoId: repo3.id, metadata: JSON.stringify({ reviewId: review3.id, riskScore: 5.5 }) },
    { eventType: "review_completed", userId: user2.id, repoId: repo5.id, metadata: JSON.stringify({ reviewId: review4.id, riskScore: 7.8 }) },
    { eventType: "review_completed", userId: user1.id, repoId: repo2.id, metadata: JSON.stringify({ reviewId: review6.id, riskScore: 4.5 }) },
    { eventType: "review_completed", userId: user2.id, repoId: repo5.id, metadata: JSON.stringify({ reviewId: review7.id, riskScore: 1.5 }) },
    { eventType: "review_failed", userId: user1.id, repoId: repo4.id, metadata: JSON.stringify({ reviewId: review8.id, error: "Processing timeout" }) },
    { eventType: "security_scan", userId: user1.id, repoId: repo1.id, metadata: JSON.stringify({ totalIssues: 1, critical: 1 }) },
    { eventType: "security_scan", userId: user2.id, repoId: repo5.id, metadata: JSON.stringify({ totalIssues: 3, critical: 1 }) },
    { eventType: "security_scan", userId: user1.id, repoId: repo3.id, metadata: JSON.stringify({ totalIssues: 2, critical: 1 }) },
    { eventType: "repo_connected", userId: user1.id, repoId: repo1.id, metadata: JSON.stringify({ fullName: "vercel/next.js" }) },
    { eventType: "repo_connected", userId: user1.id, repoId: repo2.id, metadata: JSON.stringify({ fullName: "facebook/react" }) },
    { eventType: "repo_connected", userId: user2.id, repoId: repo3.id, metadata: JSON.stringify({ fullName: "denoland/deno" }) },
    { eventType: "repo_connected", userId: user2.id, repoId: repo4.id, metadata: JSON.stringify({ fullName: "openai/tiktoken" }) },
    { eventType: "repo_connected", userId: user1.id, repoId: repo5.id, metadata: JSON.stringify({ fullName: "langchain-ai/langchain" }) },
    { eventType: "pr_created", userId: user1.id, repoId: repo1.id, metadata: JSON.stringify({ prNumber: 52341, title: "feat: implement streaming SSR" }) },
    { eventType: "pr_created", userId: user2.id, repoId: repo2.id, metadata: JSON.stringify({ prNumber: 28456, title: "fix: resolve memory leak" }) },
    { eventType: "pr_created", userId: user1.id, repoId: repo3.id, metadata: JSON.stringify({ prNumber: 19832, title: "feat: add WebSocket support" }) },
  ];

  for (const event of analyticsEvents) {
    await db.analyticsEvent.create({ data: event });
  }

  return {
    users: 2,
    repositories: 5,
    pullRequests: 10,
    reviews: 8,
    comments: comments.length,
    securityScans: 3,
    analyticsEvents: analyticsEvents.length,
  };
}
