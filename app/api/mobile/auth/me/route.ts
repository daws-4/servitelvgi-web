import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getInstallerFromBearerToken } from "@/lib/authHelpers";
import InstallerModel from "@/models/Installer";
import CrewModel from "@/models/Crew";

export async function GET(request: NextRequest) {
  await connectDB();

  try {
    // Get Authorization header
    const authHeader = request.headers.get("authorization");
    
    // Verify token and get installer info
    const sessionUser = await getInstallerFromBearerToken(authHeader);
    
    if (!sessionUser) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // Fetch updated installer data from database
    const installer = await InstallerModel.findById(sessionUser.userId)
      .select("-password") // Exclude password field
      .lean() as any;
    
    if (!installer) {
      return NextResponse.json(
        { message: "Instalador no encontrado" },
        { status: 404 }
      );
    }

    // Get crew information if installer has one
    let crewData = null;
    if (installer.currentCrew) {
      const crew = await CrewModel.findById(installer.currentCrew)
        .select("name")
        .lean() as any;
      
      if (crew) {
        crewData = {
          _id: crew._id.toString(),
          name: crew.name
        };
      }
    }

    // Return current installer data
    return NextResponse.json(
      {
        installer: {
          _id: installer._id.toString(),
          username: installer.username,
          name: installer.name,
          surname: installer.surname,
          email: installer.email,
          phone: installer.phone,
          status: installer.status,
          onDuty: installer.onDuty,
          showInventory: installer.showInventory || false,
          crew: crewData
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Mobile /me error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
