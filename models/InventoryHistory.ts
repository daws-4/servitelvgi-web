// models/InventoryHistory.js

import mongoose from "mongoose";

const InventoryHistorySchema = new mongoose.Schema(
  {
    // Ítem afectado por el movimiento
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    // Detalles del movimiento
    type: {
      type: String,
      enum: ["entry", "assignment", "return", "usage_order", "adjustment"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true, // Positivo para entradas/devoluciones, negativo para asignaciones/usos
    },

    // Contexto del movimiento
    reason: { type: String },
    installer: {
      // Técnico involucrado (si aplica)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installer",
    },
    order: {
      // Orden asociada (si aplica)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
); // Solo nos interesa la fecha de creación del registro

const InventoryHistoryModel =
  mongoose.models?.InventoryHistory ||
  mongoose.model("InventoryHistory", InventoryHistorySchema);
export default InventoryHistoryModel;
