import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

const invalidCredentialsResponse = () =>
  NextResponse.json(
    { success: false, message: "Invalid email or password." },
    { status: 401 },
  );

export async function POST(request: Request) {
  try {
    let body: LoginBody;

    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password || !EMAIL_PATTERN.test(email)) {
      return !email || !password
        ? NextResponse.json(
            { success: false, message: "Email and password are required." },
            { status: 400 },
          )
        : invalidCredentialsResponse();
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, message: "Login is temporarily unavailable." },
        { status: 500 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return invalidCredentialsResponse();
    }

    const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, {
      expiresIn: TOKEN_MAX_AGE,
    });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to log in." },
      { status: 500 },
    );
  }
}
