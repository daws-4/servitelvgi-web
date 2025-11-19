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
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createInstaller(body);
    return NextResponse.json(created, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
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
      { message: "Deleted" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
