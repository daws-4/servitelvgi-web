// models/OrderSnapshot.ts
// Modelo para almacenar snapshots diarios de órdenes por cuadrilla
// Permite análisis histórico de productividad y carga de trabajo

import mongoose from "mongoose";

const OrderSnapshotSchema = new mongoose.Schema(
    {
        // Fecha del snapshot (normalmente al final del día)
        snapshotDate: {
            type: Date,
            required: true,
            index: true,
        },

        // Desglose de órdenes por cuadrilla
        crewSnapshots: [
            {
                crew: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Crew",
                    required: true,
                },
                crewNumber: {
                    type: Number,
                    required: true,
                },
                leaderName: {
                    type: String,
                    required: true,
                },
                orders: {
                    pending: { type: Number, default: 0 },
                    assigned: { type: Number, default: 0 },
                    in_progress: { type: Number, default: 0 },
                    completed: { type: Number, default: 0 },
                    cancelled: { type: Number, default: 0 },
                    visita: { type: Number, default: 0 },
                    hard: { type: Number, default: 0 },
                    total: { type: Number, default: 0 },
                },
                byType: {
                    instalacion: {
                        pending: { type: Number, default: 0 },
                        assigned: { type: Number, default: 0 },
                        in_progress: { type: Number, default: 0 },
                        completed: { type: Number, default: 0 },
                        cancelled: { type: Number, default: 0 },
                        visita: { type: Number, default: 0 },
                        hard: { type: Number, default: 0 },
                        total: { type: Number, default: 0 },
                    },
                    averia: {
                        pending: { type: Number, default: 0 },
                        assigned: { type: Number, default: 0 },
                        in_progress: { type: Number, default: 0 },
                        completed: { type: Number, default: 0 },
                        cancelled: { type: Number, default: 0 },
                        visita: { type: Number, default: 0 },
                        hard: { type: Number, default: 0 },
                        total: { type: Number, default: 0 },
                    },
                    recuperacion: {
                        pending: { type: Number, default: 0 },
                        assigned: { type: Number, default: 0 },
                        in_progress: { type: Number, default: 0 },
                        completed: { type: Number, default: 0 },
                        cancelled: { type: Number, default: 0 },
                        visita: { type: Number, default: 0 },
                        hard: { type: Number, default: 0 },
                        total: { type: Number, default: 0 },
                    },
                    otro: {
                        pending: { type: Number, default: 0 },
                        assigned: { type: Number, default: 0 },
                        in_progress: { type: Number, default: 0 },
                        completed: { type: Number, default: 0 },
                        cancelled: { type: Number, default: 0 },
                        visita: { type: Number, default: 0 },
                        hard: { type: Number, default: 0 },
                        total: { type: Number, default: 0 },
                    },
                },
            },
        ],

        // Totales globales
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalCompleted: {
            type: Number,
            default: 0,
        },
        totalPending: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Índice para búsquedas por rango de fechas
OrderSnapshotSchema.index({ snapshotDate: -1, createdAt: -1 });

const OrderSnapshotModel =
    mongoose.models?.OrderSnapshot ||
    mongoose.model("OrderSnapshot", OrderSnapshotSchema);

export default OrderSnapshotModel;
