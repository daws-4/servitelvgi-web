import { NextRequest, NextResponse } from "next/server";
import { syncOrderToNetuno } from "@/lib/orderService";
import OrderModel from "@/models/Order";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/authHelpers";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getUserFromRequest(request);
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Validar que existan pilotos automáticos activados
        const UserModel = require("@/models/User").default;
        const autopilotAdmins = await UserModel.find({ isAutopilot: true }).select("phoneNumber").lean();
        
        if (!autopilotAdmins || autopilotAdmins.length === 0) {
            return NextResponse.json(
                { error: "Debe haber al menos un administrador con el Piloto Automático activado para poder sincronizar atrasadas." },
                { status: 400 }
            );
        }

        // Buscar todas las órdenes completadas pero no enviadas a netuno
        const unsentOrders = await OrderModel.find({
            status: { $in: ['completed', 'completed_special'] },
            $or: [{ sentToNetuno: false }, { sentToNetuno: { $exists: false } }]
        }).select('_id').lean();

        if (unsentOrders.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No hay órdenes pendientes por sincronizar." });
        }

        let successCount = 0;
        for (const order of unsentOrders as any[]) {
            try {
                const res = await syncOrderToNetuno(order._id.toString(), undefined, sessionUser);
                if (res.success) {
                    successCount++;
                }
            } catch (err) {
                console.error(`Error sync backlog order ${order._id}:`, err);
            }
        }

        revalidateTag("orders", "max");

        return NextResponse.json({ success: true, count: successCount, total: unsentOrders.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
