import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

function getSafeDiagnosticMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]")
    .replace(
      /((?:password|passwd|pwd|username|user|token|secret|key)\s*[=:]\s*)[^\s,;]+/gi,
      "$1[redacted]",
    );
}

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error: unknown) {
    const diagnosticError =
      error instanceof Error && error.cause instanceof Error
        ? error.cause
        : error;
    const errorName =
      diagnosticError instanceof Error ? diagnosticError.name : "UnknownError";

    console.error("[test-db] MongoDB connection failed", {
      name: errorName,
      message: getSafeDiagnosticMessage(diagnosticError),
    });

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 },
    );
  }
}
