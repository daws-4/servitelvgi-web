import { NextResponse } from "next/server";
import {
  createInstaller,
  getInstallers,
  getInstallerById,
  updateInstaller,
  deleteInstaller,
} from "@/lib/installerService";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      const item = await getInstallerById(id);
      if (!item)
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }
    const items = await getInstallers();
    return NextResponse.json(items, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Error in GET /api/web/installers:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required user fields
    const { username, password, email, surname, name, phone, status, currentCrew } = body;
    if (!username || !password || !email || !surname || !name || !phone || !status ) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    const created = await createInstaller(body);
    return NextResponse.json(created, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('Error in POST /api/web/installers:', err);
    
    // Handle duplicate username/email error
    if (err.code === 11000 || err.message?.includes('ya existe')) {
      return NextResponse.json(
        { error: err.message || "El nombre de usuario o email ya existe" },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || body._id;
    if (!id)
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    const data = { ...body };
    delete data.id;
    delete data._id;
    const updated = await updateInstaller(id, data);
    if (!updated)
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    let bodyId = null;
    try {
      const body = await request.json();
      bodyId = body.id || body._id;
    } catch (e) {
      /* ignore */
    }
    const finalId = id || bodyId;
    if (!finalId)
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    
    const deleted = await deleteInstaller(finalId);
    if (!deleted)
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    
    return NextResponse.json(
      { message: "Installer deleted successfully" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Error in DELETE /api/web/installers:', err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
