// models/InventorySnapshot.ts
// Modelo para almacenar snapshots diarios del inventario completo
// Permite análisis histórico y cálculo de estadísticas de uso de materiales

import mongoose from "mongoose";

const InventorySnapshotSchema = new mongoose.Schema(
  {
    // Fecha del snapshot (normalmente 23:59 del día)
    snapshotDate: {
      type: Date,
      required: true,
      index: true, // Índice para búsquedas rápidas por fecha
    },

    // Estado del inventario en bodega central
    warehouseInventory: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        // Datos desnormalizados para consultas rápidas sin populate
        code: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],

    // Estado del inventario de cada cuadrilla
    crewInventories: [
      {
        crew: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Crew",
          required: true,
        },
        crewName: {
          type: String,
          required: true,
        },
        items: [
          {
            item: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
            code: {
              type: String,
              required: true,
            },
            description: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],

    // Metadatos útiles para reportes
    totalItems: {
      type: Number,
      default: 0,
    },
    totalWarehouseStock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Solo createdAt
  }
);

// Índice compuesto para búsquedas por rango de fechas
InventorySnapshotSchema.index({ snapshotDate: -1, createdAt: -1 });

const InventorySnapshotModel =
  mongoose.models?.InventorySnapshot ||
  mongoose.model("InventorySnapshot", InventorySnapshotSchema);

export default InventorySnapshotModel;
