import { NextRequest, NextResponse } from "next/server";
import { getOrderHistories } from "@/lib/orderHistoryService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      orderId: searchParams.get("orderId") || undefined,
      crewId: searchParams.get("crewId") || undefined,
      changeType: searchParams.get("changeType") || undefined,
    };

    const histories = await getOrderHistories(filters);
    
    return NextResponse.json(histories, { status: 200 });
  } catch (error) {
    console.error("Error fetching order histories:", error);
    return NextResponse.json(
      { error: "Error al obtener el historial de órdenes" },
      { status: 500 }
    );
  }
}
