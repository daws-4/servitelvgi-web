import { NextResponse } from "next/server";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "@/lib/orderService";
import { processOrderUsage } from "@/lib/inventoryService";

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
      const item = await getOrderById(id);
      if (!item)
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }
    const items = await getOrders();
    return NextResponse.json(items, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createOrder(body);
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
    
    // INTEGRACIÓN DE INVENTARIO: Si la orden se está completando con materiales usados
    // procesar el consumo automáticamente
    if (
      data.status === 'completed' && 
      data.materialsUsed && 
      Array.isArray(data.materialsUsed) && 
      data.materialsUsed.length > 0
    ) {
      // Obtener la orden actual para verificar que tiene cuadrilla asignada
      const currentOrder = await getOrderById(id);
      
      if (!currentOrder) {
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404, headers: CORS_HEADERS }
        );
      }
      
      if (!currentOrder.assignedTo) {
        return NextResponse.json(
          { error: "La orden debe tener una cuadrilla asignada para consumir materiales" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      
      // Procesar consumo de materiales del inventario de la cuadrilla
      try {
        await processOrderUsage(
          id,
          currentOrder.assignedTo.toString(),
          data.materialsUsed.map((m: any) => ({
            inventoryId: m.item || m.inventoryId,
            quantity: m.quantity
          }))
        );
      } catch (materialError: any) {
        return NextResponse.json(
          { error: `Error al procesar materiales: ${materialError.message}` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }
    
    const updated = await updateOrder(id, data);
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
    const deleted = await deleteOrder(finalId);
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
