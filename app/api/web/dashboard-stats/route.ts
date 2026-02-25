import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";

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
            // Step 1: Only touch today's documents
            {
                $match: {
                    updatedAt: { $gte: startOfDay, $lte: endOfDay },
                },
            },
            // Step 2: Group on the server side and count each bucket we need
            {
                $group: {
                    _id: null,
                    averiasCompletadas: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$type", "averia"] }, { $eq: ["$status", "completed"] }] },
                                1,
                                0,
                            ],
                        },
                    },
                    instalacionesCompletadas: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$type", "instalacion"] }, { $eq: ["$status", "completed"] }] },
                                1,
                                0,
                            ],
                        },
                    },
                    visitasCompletadas: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "visita"] }, 1, 0],
                        },
                    },
                    averiasSinCompletar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$type", "averia"] },
                                        { $ne: ["$status", "completed"] },
                                        { $ne: ["$status", "visita"] },
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
                                        { $ne: ["$status", "completed"] },
                                        { $ne: ["$status", "visita"] },
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
                    // Cache for 60 seconds — stats don't need to be real-time to the second
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
