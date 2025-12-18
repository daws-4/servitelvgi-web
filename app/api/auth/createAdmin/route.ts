import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET method - backward compatibility (creates hardcoded admin)
export async function GET() {
  try {
    await connectDB();

    const username = "aleuwu";
    const plainPassword = "123456";
    const name = 'Alexandra';
    const surname = 'Álvarez';
    const email = 'aleuwu@gmail.com';
    const role = 'admin';

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
      name,
      surname,
      email,
      role,
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

// POST method - accepts form data from registration page
export async function POST(req: Request) {
  try {
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { name, surname, email, username, password } = body;

    // Validate required fields
    if (!name || !surname || !email || !username || !password) {
      return NextResponse.json(
        { ok: false, message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username }).exec();
    if (existingUsername) {
      return NextResponse.json(
        { ok: false, message: "El nombre de usuario ya está en uso" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email }).exec();
    if (existingEmail) {
      return NextResponse.json(
        { ok: false, message: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create admin user
    const created = await User.create({
      username,
      password: hashed,
      name,
      surname,
      email,
      role: 'admin',
      isActive: true,
    });

    const safe = created.toObject();
    delete (safe as any).password;

    return NextResponse.json(
      { ok: true, message: "Administrador creado exitosamente", user: safe },
      { status: 201 }
    );
  } catch (err) {
    console.error("createAdmin POST error", err);
    return NextResponse.json(
      { ok: false, message: "Error al crear el administrador" },
      { status: 500 }
    );
  }
}
