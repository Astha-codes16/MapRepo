import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface AuthTokenPayload extends JwtPayload {
  sub: string;
}

function isAuthTokenPayload(payload: string | JwtPayload): payload is AuthTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    payload.sub.length > 0
  );
}

export async function getCurrentUser(): Promise<string | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return null;
    }

    const payload = jwt.verify(token, secret);

    return isAuthTokenPayload(payload) ? payload.sub : null;
  } catch {
    return null;
  }
}
