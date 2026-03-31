import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { getStartAndEndOfDay } from "@/lib/timezone";
import OrderModel from "@/models/Order";
import { COMPLETED_STATUSES, TERMINAL_STATUSES } from "@/lib/orderConstants";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/web/dashboard-stats
 *
 * Devuelve estadísticas del día actual calculadas directamente en MongoDB
 * mediante una agregación $group. Esto evita traer todos los documentos al
 * servidor para filtrarlos en JavaScript, reduciendo significativamente el
 * uso de CPU en las funciones serverless de Vercel.
 *
 * Respuesta:
 * {
 *   averiasCompletadas: number,
 *   instalacionesCompletadas: number,
 *   visitasCompletadas: number,
 *   averiasSinCompletar: number,
 *   instalacionesSinCompletar: number,
 *   generatedAt: string (ISO date)
 * }
 */
/**
 * Cached aggregation — revalidates every 60 s or when an order mutates
 * (POST/PUT/DELETE on /api/web/orders call revalidateTag('orders')).
 * If MongoDB is temporarily unavailable, Next.js serves the stale result
 * instead of returning a 500.
 */
const getCachedDashboardStats = unstable_cache(
    async () => {
        await connectDB();

        const { start: startOfDay, end: endOfDay } = getStartAndEndOfDay();

        const pipeline = [
            {
                $match: {
                    $or: [
                        { updatedAt: { $gte: startOfDay, $lte: endOfDay } },
                        { status: { $nin: [...TERMINAL_STATUSES, "canceled"] } }
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    averiasCompletadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "averia"] },
                                        { $in: ["$status", COMPLETED_STATUSES] },
                                        { $gte: ["$updatedAt", startOfDay] },
                                        { $lte: ["$updatedAt", endOfDay] }
                                    ]
                                },
                                1, 0,
                            ],
                        },
                    },
                    instalacionesCompletadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "instalacion"] },
                                        { $in: ["$status", COMPLETED_STATUSES] },
                                        { $gte: ["$updatedAt", startOfDay] },
                                        { $lte: ["$updatedAt", endOfDay] }
                                    ]
                                },
                                1, 0,
                            ],
                        },
                    },
                    visitasCompletadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "visita"] },
                                        { $gte: ["$updatedAt", startOfDay] },
                                        { $lte: ["$updatedAt", endOfDay] }
                                    ]
                                },
                                1, 0,
                            ],
                        },
                    },
                    averiasSinCompletar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "averia"] },
                                        { $not: [{ $in: ["$status", [...TERMINAL_STATUSES, "canceled"]] }] },
                                    ],
                                },
                                1, 0,
                            ],
                        },
                    },
                    instalacionesSinCompletar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "instalacion"] },
                                        { $not: [{ $in: ["$status", [...TERMINAL_STATUSES, "canceled"]] }] },
                                    ],
                                },
                                1, 0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    averiasCompletadas: 1,
                    instalacionesCompletadas: 1,
                    visitasCompletadas: 1,
                    averiasSinCompletar: 1,
                    instalacionesSinCompletar: 1,
                },
            },
        ];

        const results = await OrderModel.aggregate(pipeline);

        return results[0] ?? {
            averiasCompletadas: 0,
            instalacionesCompletadas: 0,
            visitasCompletadas: 0,
            averiasSinCompletar: 0,
            instalacionesSinCompletar: 0,
        };
    },
    ['dashboard-stats'],
    { tags: ['dashboard-stats'], revalidate: 60 }
);

export async function GET() {
    try {
        const stats = await getCachedDashboardStats();

        return NextResponse.json(
            { ...stats, generatedAt: new Date().toISOString() },
            {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
                },
            }
        );
    } catch (err) {
        console.error("[dashboard-stats] Error:", err);
        return NextResponse.json(
            { error: String(err) },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
