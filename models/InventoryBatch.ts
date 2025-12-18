// models/InventoryBatch.ts
// Modelo para gestionar bobinas/carretes de cable

import mongoose from "mongoose";

const InventoryBatchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    initialQuantity: {
      type: Number,
      required: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "metros",
    },
    supplier: {
      type: String,
      default: "Netuno",
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    location: {
      type: String,
      enum: ["warehouse", "crew"],
      default: "warehouse",
    },
    crew: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
    },
    status: {
      type: String,
      enum: ["active", "depleted", "returned"],
      default: "active",
    },
  },
  { timestamps: true }
);

const InventoryBatchModel =
  mongoose.models?.InventoryBatch ||
  mongoose.model("InventoryBatch", InventoryBatchSchema);

export default InventoryBatchModel;
