import mongoose from "mongoose";
import OrderModel from "./models/Order.js";

async function run() {
    await mongoose.connect(process.env.MONGODB || "mongodb://localhost:27017/servitelv");
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const pipeline = [
        {
            $match: {
                $or: [
                    { updatedAt: { $gte: startOfDay, $lte: endOfDay } },
                    { status: { $nin: ["completed", "cancelled", "canceled", "visita"] } }
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
                                    { $eq: ["$status", "completed"] },
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
                                    { $eq: ["$status", "completed"] },
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
                                    { $not: [ { $in: ["$status", ["completed", "cancelled", "canceled", "visita"]] } ] },
                                ]
                            },
                            1, 0
                        ]
                    }
                },
                instalacionesSinCompletar: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$type", "instalacion"] },
                                    { $not: [ { $in: ["$status", ["completed", "cancelled", "canceled", "visita"]] } ] },
                                ]
                            },
                            1, 0
                        ]
                    }
                }
            }
        }
    ];

    try {
        const results = await OrderModel.aggregate(pipeline);
        console.log("Stats result:", results);
    } catch (e) {
        console.error("Aggregation error:", e);
    }
    await mongoose.disconnect();
}

run();
