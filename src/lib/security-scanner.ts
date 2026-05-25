// AI Code Review Assistant - Security Scanner Library

export interface SecretFinding {
  type: string;
  filePath: string;
  lineNumber: number;
  severity: "critical" | "high" | "medium" | "low";
  match: string;
  description: string;
}

export interface OWASPFinding {
  owaspId: string;
  category: string;
  filePath: string;
  lineNumber: number;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  suggestion: string;
}

const SECRET_PATTERNS: {
  name: string;
  pattern: RegExp;
  severity: SecretFinding["severity"];
  description: string;
}[] = [
  {
    name: "AWS Access Key ID",
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    severity: "critical",
    description: "AWS Access Key ID detected. This credential should never be committed to source control.",
  },
  {
    name: "AWS Secret Access Key",
    pattern: /(?:aws_secret_access_key\s*[:=]\s*|AWS_SECRET_ACCESS_KEY\s*[:=]\s*)['"?[A-Za-z0-9/+=]{40}['"?]/g,
    severity: "critical",
    description: "AWS Secret Access Key detected. Rotate this key immediately.",
  },
  {
    name: "GitHub Token",
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
    severity: "critical",
    description: "GitHub personal access token detected. Revoke this token immediately.",
  },
  {
    name: "GitHub OAuth Access Token",
    pattern: /gho_[A-Za-z0-9]{36}/g,
    severity: "critical",
    description: "GitHub OAuth access token detected.",
  },
  {
    name: "Stripe Secret Key",
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: "critical",
    description: "Stripe live secret key detected. Rotate this key in the Stripe dashboard.",
  },
  {
    name: "Stripe Publishable Key",
    pattern: /pk_live_[0-9a-zA-Z]{24,}/g,
    severity: "medium",
    description: "Stripe live publishable key detected. While not secret, verify this is intentional.",
  },
  {
    name: "Generic API Key",
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"?[A-Za-z0-9\-_]{20,}['"?]/gi,
    severity: "high",
    description: "Generic API key detected. Use environment variables or a secrets manager instead.",
  },
  {
    name: "Generic Secret",
    pattern: /(?:secret|password|passwd|pwd|token|auth)\s*[:=]\s*['"?[A-Za-z0-9\-_=]{16,}['"?]/gi,
    severity: "high",
    description: "Hardcoded secret or password detected. Use environment variables or a secrets manager.",
  },
  {
    name: "Private Key",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: "critical",
    description: "Private key detected. Keys should never be committed to source control.",
  },
  {
    name: "JWT Secret",
    pattern: /(?:jwt[_-]?secret|JWT_SECRET)\s*[:=]\s*['"?[A-Za-z0-9\-_=]{16,}['"?]/gi,
    severity: "high",
    description: "JWT secret detected. Use environment variables for JWT secrets.",
  },
  {
    name: "Database Connection String",
    pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/gi,
    severity: "critical",
    description: "Database connection string with credentials detected.",
  },
  {
    name: "Slack Token",
    pattern: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g,
    severity: "high",
    description: "Slack token detected. Rotate this token in the Slack dashboard.",
  },
  {
    name: "Google API Key",
    pattern: /AIza[0-9A-Za-z\-_]{35}/g,
    severity: "high",
    description: "Google API key detected. Restrict this key in the Google Cloud console.",
  },
];

const OWASP_PATTERNS: {
  owaspId: string;
  category: string;
  pattern: RegExp;
  language: string[];
  severity: OWASPFinding["severity"];
  message: string;
  suggestion: string;
}[] = [
  // SQL Injection (A03:2021 - Injection)
  {
    owaspId: "A03:2021",
    category: "SQL Injection",
    pattern: /(?:string\.format|f['"`].*\{.*\}.*['"`]|%\s*\w|`\s*\$\{.*\}\s*`).*?(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\s/gi,
    language: ["python", "java", "javascript", "typescript", "ruby", "php", "go"],
    severity: "critical",
    message: "Potential SQL injection detected. String interpolation or formatting used in SQL query.",
    suggestion: "Use parameterized queries or prepared statements instead of string interpolation.",
  },
  {
    owaspId: "A03:2021",
    category: "SQL Injection",
    pattern: /(?:execute|exec|query|run)\s*\(\s*['"`].*?\+\s*['"`]/gi,
    language: ["javascript", "typescript", "python", "java", "ruby"],
    severity: "critical",
    message: "Potential SQL injection detected. String concatenation used in SQL query.",
    suggestion: "Use parameterized queries with placeholder values instead of concatenating user input.",
  },
  {
    owaspId: "A03:2021",
    category: "SQL Injection",
    pattern: /(?:cursor|connection)\.execute\s*\(\s*['"`][^'"`]*(?:%s|\?|:1|\$\d)[^'"`]*['"`]/gi,
    language: ["python", "java", "ruby"],
    severity: "medium",
    message: "SQL query uses parameterized format. Verify that parameters are properly bound.",
    suggestion: "Ensure you pass parameters as a separate tuple/list argument, not interpolated into the query string.",
  },
  // XSS (A07:2021 - Cross-Site Scripting)
  {
    owaspId: "A07:2021",
    category: "Cross-Site Scripting (XSS)",
    pattern: /innerHTML\s*=\s*(?![\s]*['"`]\s*$)/gi,
    language: ["javascript", "typescript"],
    severity: "high",
    message: "Direct innerHTML assignment detected. This can lead to XSS if user input is not sanitized.",
    suggestion: "Use textContent for plain text, or sanitize HTML with a library like DOMPurify before assigning to innerHTML.",
  },
  {
    owaspId: "A07:2021",
    category: "Cross-Site Scripting (XSS)",
    pattern: /dangerouslySetInnerHTML\s*=\s*\{/gi,
    language: ["javascript", "typescript"],
    severity: "high",
    message: "React dangerouslySetInnerHTML detected. Ensure content is sanitized.",
    suggestion: "Sanitize HTML content with DOMPurify before using dangerouslySetInnerHTML, or use React's built-in text rendering.",
  },
  {
    owaspId: "A07:2021",
    category: "Cross-Site Scripting (XSS)",
    pattern: /document\.write\s*\(/gi,
    language: ["javascript", "typescript"],
    severity: "high",
    message: "document.write() detected. This can lead to XSS vulnerabilities.",
    suggestion: "Use DOM manipulation methods like createElement and textContent, or framework-specific rendering.",
  },
  {
    owaspId: "A07:2021",
    category: "Cross-Site Scripting (XSS)",
    pattern: /eval\s*\(|new\s+Function\s*\(/gi,
    language: ["javascript", "typescript"],
    severity: "critical",
    message: "eval() or Function constructor detected. This can execute arbitrary code and lead to XSS.",
    suggestion: "Avoid eval() entirely. Use JSON.parse() for data parsing, or safer alternatives for dynamic behavior.",
  },
  // Path Traversal (A01:2021 - Broken Access Control)
  {
    owaspId: "A01:2021",
    category: "Path Traversal",
    pattern: /(?:readFile|writeFile|appendFile|open|createReadStream|createWriteStream|fs\.\w+)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/gi,
    language: ["javascript", "typescript"],
    severity: "critical",
    message: "File system operation with user-controlled input detected. Potential path traversal vulnerability.",
    suggestion: "Validate and sanitize file paths. Use path.resolve() and check that the result is within the allowed directory.",
  },
  {
    owaspId: "A01:2021",
    category: "Path Traversal",
    pattern: /\.\.[\/\\]/g,
    language: ["javascript", "typescript", "python", "java", "go", "ruby", "php"],
    severity: "medium",
    message: "Path traversal sequence (../) detected. Verify this is not constructed from user input.",
    suggestion: "Normalize paths using path.resolve() and validate they stay within the intended directory.",
  },
  // Insecure Deserialization (A08:2021)
  {
    owaspId: "A08:2021",
    category: "Insecure Deserialization",
    pattern: /pickle\.loads?\s*\(|yaml\.load\s*\([^)]*\)(?!\s*,\s*Loader\s*=\s*yaml\.SafeLoader)/gi,
    language: ["python"],
    severity: "critical",
    message: "Insecure deserialization detected. pickle.loads or unsafe yaml.load can execute arbitrary code.",
    suggestion: "Use json.loads() for data, or yaml.load(data, Loader=yaml.SafeLoader) for YAML.",
  },
  {
    owaspId: "A08:2021",
    category: "Insecure Deserialization",
    pattern: /unserialize\s*\(/gi,
    language: ["php"],
    severity: "critical",
    message: "PHP unserialize() detected. This can lead to object injection vulnerabilities.",
    suggestion: "Use json_decode() instead of unserialize() for user-provided data.",
  },
  // Command Injection (A03:2021 - Injection)
  {
    owaspId: "A03:2021",
    category: "Command Injection",
    pattern: /(?:exec|spawn|execSync|execFile)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/gi,
    language: ["javascript", "typescript"],
    severity: "critical",
    message: "Command execution with user-controlled input detected. This can lead to command injection.",
    suggestion: "Never pass user input directly to command execution. Use allowlists for commands and validate all inputs.",
  },
  {
    owaspId: "A03:2021",
    category: "Command Injection",
    pattern: /os\.system\s*\(|os\.popen\s*\(|subprocess\.call\s*\([^)]*shell\s*=\s*True|subprocess\.Popen\s*\([^)]*shell\s*=\s*True/gi,
    language: ["python"],
    severity: "critical",
    message: "Shell command execution detected with potential user input. This can lead to command injection.",
    suggestion: "Use subprocess.run() with a list of arguments instead of shell=True, and validate all inputs.",
  },
  // XXE (A05:2021 - Security Misconfiguration)
  {
    owaspId: "A05:2021",
    category: "XML External Entity (XXE)",
    pattern: /xml\.etree\.ElementTree\.parse\s*\(|xml\.dom\.minidom\.parse\s*\(|lxml\.etree\.parse\s*\(/gi,
    language: ["python"],
    severity: "high",
    message: "XML parsing detected. Ensure external entity processing is disabled to prevent XXE attacks.",
    suggestion: "Use defusedxml library or disable external entity processing in your XML parser configuration.",
  },
  {
    owaspId: "A05:2021",
    category: "XML External Entity (XXE)",
    pattern: /new\s+DOMParser\s*\(\s*\)\.parseFromString/gi,
    language: ["javascript", "typescript"],
    severity: "medium",
    message: "DOMParser XML parsing detected. Ensure external entities are not processed.",
    suggestion: "Sanitize XML input before parsing, or use a library that disables external entity resolution.",
  },
  // Open Redirect (A01:2021 - Broken Access Control)
  {
    owaspId: "A01:2021",
    category: "Open Redirect",
    pattern: /(?:redirect|res\.redirect|response\.redirect|HttpResponseRedirect)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/gi,
    language: ["javascript", "typescript", "python"],
    severity: "medium",
    message: "Redirect with user-controlled input detected. This can lead to open redirect vulnerabilities.",
    suggestion: "Validate redirect URLs against an allowlist of trusted domains, or use relative paths only.",
  },
  // Hardcoded Credentials (A07:2021 - Identification and Authentication Failures)
  {
    owaspId: "A07:2021",
    category: "Hardcoded Credentials",
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{4,}['"`]/gi,
    language: ["javascript", "typescript", "python", "java", "ruby", "php", "go"],
    severity: "high",
    message: "Hardcoded password detected in source code.",
    suggestion: "Store credentials in environment variables or use a secrets management service.",
  },
  // Insecure TLS/SSL (A02:2021 - Cryptographic Failures)
  {
    owaspId: "A02:2021",
    category: "Cryptographic Failures",
    pattern: /verify\s*[:=]\s*False|verify\s*[:=]\s*false|rejectUnauthorized\s*[:=]\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*[:=]\s*['"?0['"?]/gi,
    language: ["javascript", "typescript", "python"],
    severity: "high",
    message: "SSL/TLS verification disabled. This makes connections vulnerable to man-in-the-middle attacks.",
    suggestion: "Never disable SSL/TLS verification in production. Fix certificate issues instead.",
  },
];

/**
 * Scan content for hardcoded secrets and credentials
 */
export function scanForSecrets(
  content: string,
  filePath: string
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split("\n");

  for (const patternDef of SECRET_PATTERNS) {
    // Reset lastIndex for global regex
    patternDef.pattern.lastIndex = 0;

    const contentMatches = [...content.matchAll(patternDef.pattern)];

    for (const match of contentMatches) {
      // Find the line number
      const matchStart = match.index ?? 0;
      const lineNumber =
        content.substring(0, matchStart).split("\n").length;

      // Mask the actual secret value
      const matchedText = match[0];
      const maskedMatch =
        matchedText.length > 8
          ? matchedText.substring(0, 4) +
            "..." +
            matchedText.substring(matchedText.length - 4)
          : "***";

      findings.push({
        type: patternDef.name,
        filePath,
        lineNumber,
        severity: patternDef.severity,
        match: maskedMatch,
        description: patternDef.description,
      });
    }
  }

  return findings;
}

/**
 * Scan code for OWASP vulnerability patterns
 */
export function scanForOWASP(
  code: string,
  filePath: string,
  language: string
): OWASPFinding[] {
  const findings: OWASPFinding[] = [];

  for (const patternDef of OWASP_PATTERNS) {
    // Skip patterns not relevant to this language
    if (
      patternDef.language.length > 0 &&
      !patternDef.language.includes(language.toLowerCase())
    ) {
      continue;
    }

    // Reset lastIndex for global regex
    patternDef.pattern.lastIndex = 0;

    const matches = [...code.matchAll(patternDef.pattern)];

    for (const match of matches) {
      const matchStart = match.index ?? 0;
      const lineNumber =
        code.substring(0, matchStart).split("\n").length;

      findings.push({
        owaspId: patternDef.owaspId,
        category: patternDef.category,
        filePath,
        lineNumber,
        severity: patternDef.severity,
        message: patternDef.message,
        suggestion: patternDef.suggestion,
      });
    }
  }

  return findings;
}
