import { NextRequest, NextResponse } from "next/server";
import { getOrderHistories } from "@/lib/orderHistoryService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      orderId: searchParams.get("orderId") || undefined,
      crewId: searchParams.get("crewId") || undefined,
      changeType: searchParams.get("changeType") || undefined,
      limit: limitParam ? parseInt(limitParam) : undefined,
      page: pageParam ? parseInt(pageParam) : undefined,
    };

    const histories = await getOrderHistories(filters);

    // Si envían parámetros de paginación devuelvo objeto `{ data, pagination }`
    // Si no, devuelvo el arreglo por compatibilidad
    if (pageParam || limitParam) {
      return NextResponse.json(histories, { status: 200 });
    } else {
      return NextResponse.json((histories as any).data || histories, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching order histories:", error);
    return NextResponse.json(
      { error: "Error al obtener el historial de órdenes" },
      { status: 500 }
    );
  }
}
