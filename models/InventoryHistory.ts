// models/InventoryHistory.ts

import mongoose from "mongoose";

const InventoryHistorySchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    type: {
      type: String,
      enum: ["entry", "assignment", "return", "usage_order", "adjustment"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true, 
    },
    reason: { type: String },
    
    
    // --- NUEVO CAMPO ---
    // Permite filtrar movimientos por cuadrilla en los reportes
    crew: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
); 

const InventoryHistoryModel =
  mongoose.models?.InventoryHistory ||
  mongoose.model("InventoryHistory", InventoryHistorySchema);
export default InventoryHistoryModel;