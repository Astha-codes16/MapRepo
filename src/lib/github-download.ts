const GITHUB_API_URL = "https://api.github.com";
const GITHUB_ARCHIVE_HOST = "codeload.github.com";
const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;
const MAX_REDIRECTS = 2;

export interface GithubArchive {
  buffer: Buffer;
  owner: string;
  repository: string;
  branch: string;
}

export class GithubDownloadError extends Error {
  constructor(
    message: string,
    public readonly code: "not-found" | "rate-limit" | "too-large" | "timeout" | "unavailable",
  ) {
    super(message);
    this.name = "GithubDownloadError";
  }
}

export async function downloadGithubRepository(
  owner: string,
  repository: string,
  branch: string,
): Promise<GithubArchive> {
  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9_-])?$/.test(owner) ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9_-])?$/.test(repository) ||
    !branch ||
    branch.includes("\\") ||
    branch.length > 255 ||
    /[\u0000-\u0020~^:?*\[\]]/.test(branch)
  ) {
    throw new GithubDownloadError("Invalid repository details.", "unavailable");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  const archiveUrl = `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/zipball/${encodeURIComponent(branch)}`;
  let stage = "requesting archive";
  let responseStatus: number | undefined;

  try {
    let downloadUrl = archiveUrl;
    let response: Response | undefined;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      stage = redirectCount === 0 ? "requesting archive" : "following GitHub archive redirect";
      response = await fetch(downloadUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "MapRepo",
        },
        signal: controller.signal,
        redirect: "manual",
      });
      responseStatus = response.status;

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        break;
      }

      const location = response.headers.get("location");
      let redirectUrl: URL;

      try {
        redirectUrl = new URL(location ?? "");
      } catch {
        throw new GithubDownloadError(
          "GitHub returned an invalid archive redirect.",
          "unavailable",
        );
      }

      if (
        redirectUrl.protocol !== "https:" ||
        redirectUrl.hostname.toLowerCase() !== GITHUB_ARCHIVE_HOST ||
        redirectUrl.port ||
        redirectUrl.username ||
        redirectUrl.password
      ) {
        throw new GithubDownloadError(
          "GitHub returned an unsafe archive redirect.",
          "unavailable",
        );
      }

      downloadUrl = redirectUrl.toString();
    }

    if (!response) {
      throw new GithubDownloadError(
        "GitHub did not return an archive response.",
        "unavailable",
      );
    }

    if (response.status === 404) {
      throw new GithubDownloadError(
        "Repository archive not found.",
        "not-found",
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new GithubDownloadError(
        "GitHub rate limit reached. Please try again later.",
        "rate-limit",
      );
    }

    if (!response.ok || !response.body) {
      throw new GithubDownloadError(
        "GitHub could not provide the repository archive.",
        "unavailable",
      );
    }

    const contentLength = response.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_DOWNLOAD_SIZE) {
      throw new GithubDownloadError(
        "Repository archive exceeds the 50 MB limit.",
        "too-large",
      );
    }

    stage = "reading archive body";
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let totalSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        totalSize += value.byteLength;

        if (totalSize > MAX_DOWNLOAD_SIZE) {
          await reader.cancel();
          throw new GithubDownloadError(
            "Repository archive exceeds the 50 MB limit.",
            "too-large",
          );
        }

        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }

    stage = "archive body received";
    return {
      buffer: Buffer.concat(chunks, totalSize),
      owner,
      repository,
      branch,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[github-download] failed", {
      stage,
      status: responseStatus,
      errorName,
      errorMessage,
    });

    if (error instanceof GithubDownloadError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GithubDownloadError(
        "Repository download timed out.",
        "timeout",
      );
    }

    throw new GithubDownloadError(
      "Unable to download the repository archive.",
      "unavailable",
    );
  } finally {
    clearTimeout(timeout);
  }
}
