import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await connectDB();

  const body = await request.json();
  // accept either `user` (frontend) or `usuario` (older payload)
  const username = body.usuario as string | undefined;
  const password = (body.password ?? body.pass) as string | undefined;

  console.log("Received login request:", { username, password });


  if (!username || !password) {
    return NextResponse.json(
      { message: "Missing credentials" },
      { status: 400 }
    );
  }

  try {
    const user = await User.findOne({ username }).exec();
    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET in environment");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create token (7 days)
    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const secureFlag = process.env.NODE_ENV === "production" ? "Secure; " : "";
    const cookie = `token=${token}; Path=/; HttpOnly; SameSite=Lax; ${secureFlag}Max-Age=${maxAge}`;
    return NextResponse.json(
      {
        message: "Login successful",
        user: { id: user._id, username: user.username, role: user.role },
      },
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );
  } catch (err) {
    console.error("Login error", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
