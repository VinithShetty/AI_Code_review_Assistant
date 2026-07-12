import { getGitHubInstallationAccessToken } from "@/lib/github-app";

export const GITHUB_API_BASE_URL = "https://api.github.com";

export type GitHubRepoResponse = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
};

async function githubFetch<T>(
  endpoint: string,
  options: { token: string; method?: string } = { token: "" }
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${endpoint}`,
    {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ai-code-review-assistant",
      },
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `GitHub API error (${response.status}) for ${endpoint}: ${text || response.statusText}`
    );
  }

  return JSON.parse(text) as T;
}

export async function getRepoByFullName(options: {
  installationId: number;
  owner: string;
  repo: string;
}): Promise<GitHubRepoResponse> {
  const token = await getGitHubInstallationAccessToken(options.installationId);
  return githubFetch<GitHubRepoResponse>(`/repos/${options.owner}/${options.repo}`,
    { token }
  );
}

export type GitHubUserRepoResponse = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  owner: { login: string; avatar_url: string };
};

/**
 * List the repositories the signed-in user can access, using THEIR OAuth
 * access token (not a GitHub App installation token). Requires the token to
 * carry the `repo` (or at least `public_repo`) scope for private repos.
 */
export async function getUserRepos(token: string): Promise<GitHubUserRepoResponse[]> {
  return githubFetch<GitHubUserRepoResponse[]>(
    "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    { token }
  );
}

// ---------------------------------------------------------------------------
// Pull requests + changed files (used by the real AI-review pipeline)
// ---------------------------------------------------------------------------

type RawGitHubPullRepo = {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  private: boolean;
};

type RawGitHubPull = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  user: { login: string; avatar_url: string } | null;
  base: { ref: string; repo: RawGitHubPullRepo | null } | null;
  head: { ref: string } | null;
};

export type GitHubUserPullRequest = {
  number: number;
  title: string;
  description: string | null;
  authorLogin: string;
  authorAvatar: string | null;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  htmlUrl: string;
  repo: {
    githubRepoId: number;
    fullName: string;
    name: string;
    description: string | null;
    language: string | null;
    isPrivate: boolean;
  } | null;
};

export type GitHubPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

/**
 * List the open pull requests for a repo using the signed-in user's OAuth token.
 * Note: the GitHub list endpoint does NOT include additions/deletions/
 * changed_files (those only come from the per-PR GET), so those fields default
 * to 0 here — the trigger pipeline recomputes them from the changed files.
 */
export async function getUserPullRequests(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubUserPullRequest[]> {
  const pulls = await githubFetch<RawGitHubPull[]>(
    `/repos/${owner}/${repo}/pulls?state=open&per_page=30`,
    { token }
  );

  return pulls.map((p) => ({
    number: p.number,
    title: p.title,
    description: p.body ?? null,
    authorLogin: p.user?.login ?? "unknown",
    authorAvatar: p.user?.avatar_url ?? null,
    baseBranch: p.base?.ref ?? "main",
    headBranch: p.head?.ref ?? "",
    additions: p.additions ?? 0,
    deletions: p.deletions ?? 0,
    changedFiles: p.changed_files ?? 0,
    htmlUrl: p.html_url,
    repo: p.base?.repo
      ? {
          githubRepoId: p.base.repo.id,
          fullName: p.base.repo.full_name,
          name: p.base.repo.name,
          description: p.base.repo.description ?? null,
          language: p.base.repo.language ?? null,
          isPrivate: p.base.repo.private,
        }
      : null,
  }));
}

/**
 * List the files changed by a pull request (filename, status, additions,
 * deletions, and the unified-diff patch), using the signed-in user's token.
 */
export async function getPullRequestFiles(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<GitHubPullFile[]> {
  return githubFetch<GitHubPullFile[]>(
    `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
    { token }
  );
}
