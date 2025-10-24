import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const username = "admin";
    const plainPassword = "123456";

    // Check if admin user already exists
    const existing = await User.findOne({ username }).exec();
    if (existing) {
      const safe = existing.toObject();
      delete (safe as any).password;
      return NextResponse.json(
        { ok: true, message: "Admin already exists", user: safe },
        { status: 200 }
      );
    }

    // Hash password (synchronous is fine for this small utility)
    const hashed = bcrypt.hashSync(plainPassword, 10);

    const created = await User.create({
      username,
      password: hashed,
      name: "Administrador",
      role: "admin",
      isActive: true,
    });

    const safe = created.toObject();
    delete (safe as any).password;

    return NextResponse.json(
      { ok: true, message: "Admin created", user: safe },
      { status: 201 }
    );
  } catch (err) {
    console.error("createAdmin error", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create admin" },
      { status: 500 }
    );
  }
}
