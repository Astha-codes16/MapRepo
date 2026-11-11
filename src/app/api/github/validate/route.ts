import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getGithubRepository,
  GithubRepositoryError,
} from "@/lib/github";

interface ValidateRepositoryBody {
  repoUrl?: unknown;
}

export async function POST(request: Request) {
  const userId = await getCurrentUser();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: ValidateRepositoryBody;

  try {
    body = (await request.json()) as ValidateRepositoryBody;
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

  try {
    const repository = await getGithubRepository(body.repoUrl);

    return NextResponse.json({
      success: true,
      repository,
    });
  } catch (error) {
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

    return NextResponse.json(
      { success: false, message: "Unable to validate repository." },
      { status: 500 },
    );
  }
}
