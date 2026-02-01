import { connectDB } from "@/lib/db";
import InstallerModel from "@/models/Installer";
import CrewModel from "@/models/Crew";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { InstallerTokenPayload } from "@/types/mobile-auth";

export async function POST(request: Request) {
  await connectDB();

  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate credentials are present
    if (!username || !password) {
      return NextResponse.json(
        { message: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Find installer by username
    const installer = await InstallerModel.findOne({ username }).exec();

    if (!installer) {
      return NextResponse.json(
        { message: "Usuario o contraseña inválidos" },
        { status: 401 }
      );
    }

    // Compare password
    const match = await bcrypt.compare(password, installer.password);
    if (!match) {
      return NextResponse.json(
        { message: "Usuario o contraseña inválidos" },
        { status: 401 }
      );
    }

    // Check if installer is active
    if (installer.status !== "active") {
      return NextResponse.json(
        {
          message: "Su cuenta está inactiva. Contacte al administrador.",
          code: "INSTALLER_INACTIVE"
        },
        { status: 403 }
      );
    }

    // Get crew information if installer has one
    let crewData = null;
    if (installer.currentCrew) {
      const crew = await CrewModel.findById(installer.currentCrew)
        .select("number")
        .lean() as any;

      if (crew) {
        crewData = {
          _id: crew._id.toString(),
          number: crew.number
        };
      }
    }

    // Verify JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET in environment");
      return NextResponse.json(
        { message: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Create JWT token (8 hours for mobile apps)
    const tokenPayload: InstallerTokenPayload = {
      sub: installer._id.toString(),
      _id: installer._id.toString(),
      username: installer.username,
      name: installer.name,
      surname: installer.surname,
      role: "installer",
      crewId: crewData?._id || null,
      crewNumber: crewData?.number || null,
      showInventory: installer.showInventory || false,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Return token in response body (not in cookies for mobile)
    return NextResponse.json(
      {
        message: "Login exitoso",
        token,
        installer: {
          _id: installer._id.toString(),
          username: installer.username,
          name: installer.name,
          surname: installer.surname,
          email: installer.email,
          phone: installer.phone,
          status: installer.status,
          onDuty: installer.onDuty,
          crew: crewData,
          showInventory: installer.showInventory || false,
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Mobile login error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
