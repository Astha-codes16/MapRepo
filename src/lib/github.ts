const GITHUB_API_URL = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10_000;

export interface GithubRepository {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

interface GithubApiRepository {
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
}

interface ParsedRepositoryUrl {
  owner: string;
  repository: string;
}

export class GithubRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid-url"
      | "not-found"
      | "private"
      | "rate-limit"
      | "timeout"
      | "unavailable",
  ) {
    super(message);
    this.name = "GithubRepositoryError";
  }
}

export function parseGithubRepositoryUrl(repoUrl: string): ParsedRepositoryUrl {
  let url: URL;

  try {
    url = new URL(repoUrl.trim());
  } catch {
    throw new GithubRepositoryError(
      "Enter a valid GitHub repository URL.",
      "invalid-url",
    );
  }

  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new GithubRepositoryError(
      "Enter a valid GitHub repository URL.",
      "invalid-url",
    );
  }

  if (url.pathname.endsWith("/")) {
    throw new GithubRepositoryError(
      "Enter a GitHub URL in the format https://github.com/owner/repository.",
      "invalid-url",
    );
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length !== 2 || segments.some((segment) => segment.includes("%"))) {
    throw new GithubRepositoryError(
      "Enter a GitHub URL in the format https://github.com/owner/repository.",
      "invalid-url",
    );
  }

  const owner = segments[0];
  const repository = segments[1].replace(/\.git$/, "");

  if (!owner || !repository || owner.includes(".") || repository.includes("/")) {
    throw new GithubRepositoryError(
      "Enter a GitHub URL in the format https://github.com/owner/repository.",
      "invalid-url",
    );
  }

  return { owner, repository };
}

export async function getGithubRepository(
  repoUrl: string,
): Promise<GithubRepository> {
  const { owner, repository } = parseGithubRepositoryUrl(repoUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "MapRepo",
        },
        signal: controller.signal,
      },
    );

    if (response.status === 404) {
      throw new GithubRepositoryError(
        "Repository not found or it is not public.",
        "not-found",
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new GithubRepositoryError(
        "GitHub rate limit reached. Please try again later.",
        "rate-limit",
      );
    }

    if (!response.ok) {
      throw new GithubRepositoryError(
        "GitHub could not validate this repository right now.",
        "unavailable",
      );
    }

    const data = (await response.json()) as GithubApiRepository;

    if (data.private) {
      throw new GithubRepositoryError(
        "Only public repositories are supported.",
        "private",
      );
    }

    return {
      full_name: data.full_name,
      name: data.name,
      owner: data.owner.login,
      description: data.description,
      html_url: data.html_url,
      default_branch: data.default_branch,
      language: data.language,
      stargazers_count: data.stargazers_count,
      updated_at: data.updated_at,
    };
  } catch (error) {
    if (error instanceof GithubRepositoryError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GithubRepositoryError(
        "GitHub request timed out. Please try again.",
        "timeout",
      );
    }

    throw new GithubRepositoryError(
      "GitHub could not validate this repository right now.",
      "unavailable",
    );
  } finally {
    clearTimeout(timeout);
  }
}
