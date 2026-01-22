import { NextRequest, NextResponse } from "next/server";
import { syncOrderToNetuno } from "@/lib/orderService";
import { getUserFromRequest } from "@/lib/authHelpers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getUserFromRequest(request);

        // Permitir si es admin, dispatcher o instalador (quizás restringir solo a admins/dispatchers?)
        // Por ahora permitimos a usuarios autenticados
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        const result = await syncOrderToNetuno(id);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error("Error syncing order:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
