import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";

export const dynamic = 'force-dynamic';

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
export async function GET() {
    try {
        await connectDB();

        const today = new Date();
        const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0,
            0,
            0,
            0
        );
        const endOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
            999
        );

        // Single aggregation pipeline — MongoDB does all the work
        const pipeline = [
            // Step 1: Match orders updated today OR orders that are not completed/cancelled
            {
                $match: {
                    $or: [
                        { updatedAt: { $gte: startOfDay, $lte: endOfDay } },
                        { status: { $in: ["pending", "assigned", "in_progress", "hard"] } }
                    ],
                },
            },
            // Step 2: Group on the server side and count each bucket we need
            {
                $group: {
                    _id: null,
                    averiasCompletadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "averia"] },
                                        { $eq: ["$status", "completed"] },
                                        { $gte: ["$updatedAt", startOfDay] },
                                        { $lte: ["$updatedAt", endOfDay] }
                                    ]
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    instalacionesCompletadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "instalacion"] },
                                        { $eq: ["$status", "completed"] },
                                        { $gte: ["$updatedAt", startOfDay] },
                                        { $lte: ["$updatedAt", endOfDay] }
                                    ]
                                },
                                1,
                                0,
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
                                1,
                                0,
                            ],
                        },
                    },
                    averiasSinCompletar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "averia"] },
                                        { $in: ["$status", ["pending", "assigned", "in_progress", "hard"]] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    instalacionesSinCompletar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "instalacion"] },
                                        { $in: ["$status", ["pending", "assigned", "in_progress", "hard"]] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            // Step 3: Clean up the _id field from $group
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

        // If no orders today, aggregate returns an empty array
        const stats = results[0] ?? {
            averiasCompletadas: 0,
            instalacionesCompletadas: 0,
            visitasCompletadas: 0,
            averiasSinCompletar: 0,
            instalacionesSinCompletar: 0,
        };

        return NextResponse.json(
            { ...stats, generatedAt: new Date().toISOString() },
            {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    "Cache-Control": "no-store, max-age=0",
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
