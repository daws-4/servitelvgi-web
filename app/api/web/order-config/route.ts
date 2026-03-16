// app/api/web/order-config/route.ts
// Endpoint que expone la configuración de statuses y tipos de orden
// Para uso del frontend web y la app móvil (mapeo dinámico)

import { NextResponse } from "next/server";
import { ORDER_STATUSES, ORDER_TYPES, VALID_STATUSES, COMPLETED_STATUSES, TERMINAL_STATUSES } from "@/lib/orderConstants";

export const dynamic = "force-dynamic";

/**
 * GET /api/web/order-config
 * 
 * Retorna la configuración completa de statuses y tipos de orden.
 * La app móvil puede hacer fetch a este endpoint al iniciar para
 * obtener la configuración actualizada sin necesidad de un nuevo APK.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      statuses: ORDER_STATUSES,
      types: ORDER_TYPES,
      validStatuses: VALID_STATUSES,
      completedStatuses: COMPLETED_STATUSES,
      terminalStatuses: TERMINAL_STATUSES,
    },
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}
