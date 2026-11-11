import { rm } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ArchiveExtractionError,
  extractZipArchive,
} from "@/lib/archive";
import {
  analyzeCodebase,
  type CodebaseAnalysis,
} from "@/lib/code-analyzer";
import {
  GithubRepositoryError,
  getGithubRepository,
  parseGithubRepositoryUrl,
} from "@/lib/github";
import { GithubDownloadError, downloadGithubRepository } from "@/lib/github-download";

export const runtime = "nodejs";

interface AnalyzeRequestBody {
  repoUrl?: unknown;
}

function getErrorResponse(error: unknown): NextResponse {
  if (error instanceof GithubRepositoryError) {
    const status =
      error.code === "invalid-url"
        ? 400
        : error.code === "not-found" || error.code === "private"
          ? 404
          : error.code === "rate-limit"
            ? 429
            : 502;

    return NextResponse.json(
      { success: false, message: error.message },
      { status },
    );
  }

  if (error instanceof GithubDownloadError) {
    const status =
      error.code === "not-found"
        ? 404
        : error.code === "rate-limit"
          ? 429
          : error.code === "too-large"
            ? 413
            : 502;

    return NextResponse.json(
      { success: false, message: error.message },
      { status },
    );
  }

  if (error instanceof ArchiveExtractionError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 422 },
    );
  }

  return NextResponse.json(
    { success: false, message: "Unable to analyze this repository." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  const userId = await getCurrentUser();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: AnalyzeRequestBody;

  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (typeof body.repoUrl !== "string" || !body.repoUrl.trim()) {
    return NextResponse.json(
      { success: false, message: "A repository URL is required." },
      { status: 400 },
    );
  }

  let extractedDirectory: string | undefined;
  let stage = "validating repository URL";

  try {
    const repoUrl = body.repoUrl.trim();
    const { owner, repository } = parseGithubRepositoryUrl(repoUrl);
    stage = "fetching repository metadata";
    const metadata = await getGithubRepository(repoUrl);
    stage = "downloading repository archive";
    const archive = await downloadGithubRepository(
      owner,
      repository,
      metadata.default_branch,
    );
    stage = "extracting repository archive";
    const extractedArchive = await extractZipArchive(archive.buffer);
    extractedDirectory = extractedArchive.directory;

    stage = "analyzing repository source";
    const analysis: CodebaseAnalysis = await analyzeCodebase(extractedDirectory);

    return NextResponse.json({
      success: true,
      repository: metadata,
      analysis: {
        files: analysis.files,
        edges: analysis.edges,
        skippedFiles: analysis.skippedFiles,
        truncated: analysis.truncated,
      },
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[github-analyze] failed", {
      stage,
      errorName,
      errorMessage,
    });
    return getErrorResponse(error);
  } finally {
    if (extractedDirectory) {
      await rm(extractedDirectory, { recursive: true, force: true });
    }
  }
}
