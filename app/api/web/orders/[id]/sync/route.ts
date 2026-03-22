import { NextRequest, NextResponse } from "next/server";
import { syncOrderToNetuno } from "@/lib/orderService";
import { getUserFromRequest } from "@/lib/authHelpers";
import { revalidatePath, revalidateTag } from "next/cache";

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

        // Check if body has certificateUrl override
        let certificateUrl = undefined;
        try {
            const body = await request.json();
            if (body && body.certificateUrl) {
                certificateUrl = body.certificateUrl;
            }
        } catch (e) {
            // Body might be empty, ignore JSON parse error
        }

        let adminPhone = undefined;
        if (sessionUser.userModel === 'User') {
            const UserModel = require("@/models/User").default;
            const adminUser = await UserModel.findById(sessionUser.userId).select("phoneNumber").lean();
            if (adminUser?.phoneNumber) {
                adminPhone = adminUser.phoneNumber;
            } else {
                return NextResponse.json(
                    { success: false, error: "No tienes un número de teléfono guardado en tu perfil para recibir el comprobante." },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, error: "Solo los administradores en sesión pueden enviarse el comprobante a sí mismos de forma manual." },
                { status: 403 }
            );
        }

        const result = await syncOrderToNetuno(id, certificateUrl, sessionUser, adminPhone);

        if (result.success) {
            revalidateTag("orders", "max");
            revalidatePath("/api/web/orders");
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
