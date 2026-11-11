export const runtime = "nodejs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const { connectDB } = await import("./instrumentation-node");
    await connectDB();
  } catch {
    console.error("Database startup connection failed.");
  }
}
