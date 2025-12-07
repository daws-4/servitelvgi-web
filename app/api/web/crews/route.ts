import { NextResponse } from "next/server";
import {
  createCrew,
  getCrews,
  getCrewById,
  updateCrew,
  deleteCrew,
} from "@/lib/crewService";

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
      const item = await getCrewById(id);
      if (!item)
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }
    const items = await getCrews();
    return NextResponse.json(items, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Error in GET /api/web/crews:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createCrew(body);
    return NextResponse.json(created, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Error in POST /api/web/crews:', err);
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
    const updated = await updateCrew(id, data);
    if (!updated)
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Error in PUT /api/web/crews:', err);
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
    const deleted = await deleteCrew(finalId);
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
    console.error('Error in DELETE /api/web/crews:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
