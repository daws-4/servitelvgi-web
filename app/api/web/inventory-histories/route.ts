import { NextResponse } from "next/server";
import {
  createInventoryHistory,
  getInventoryHistories,
  getInventoryHistoryById,
  updateInventoryHistory,
  deleteInventoryHistory,
} from "@/lib/inventoryHistoryService";

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
      const item = await getInventoryHistoryById(id);
      if (!item)
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }

    // Extraer filtros de query params
    // Extraer filtros de query params
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const crewId = url.searchParams.get("crewId") || undefined;
    const itemId = url.searchParams.get("itemId") || undefined;

    // Pagination params
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const page = pageParam ? parseInt(pageParam) : undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const filters = {
      startDate,
      endDate,
      crewId,
      itemId,
      page,
      limit
    };

    const result = await getInventoryHistories(filters);

    // For backward compatibility: if pagination was not requested (no limit),
    // and layout suggests legacy, we might need to be careful.
    // However, getInventoryHistories now returns { data, pagination }.
    // We need to check if we should unwrap it.

    // Logic: If 'page' or 'limit' was explicitly passed, return full object.
    // If not, return just the array to support existing frontend.
    if (page || limit) {
      return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
    } else {
      return NextResponse.json(result.data, { status: 200, headers: CORS_HEADERS });
    }
  } catch (err: any) {
    console.error("Error in inventory-histories GET:", err);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createInventoryHistory(body);
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
    const updated = await updateInventoryHistory(id, data);
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
    const deleted = await deleteInventoryHistory(finalId);
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
