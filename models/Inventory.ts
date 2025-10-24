// models/Inventory.js

import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    // Identificadores del ítem, basados en tu archivo Excel
    code: {
      type: String,
      required: true,
      unique: true, // Código único como '00-001'
    },
    description: {
      type: String,
      required: true, // Nombre del material, ej: 'CONECTORES RAPIDOS'
    },
    unit: {
      type: String,
      default: "unidades",
    },

    // Gestión del stock en la bodega principal
    currentStock: {
      type: Number,
      default: 0,
    },
    minimumStock: {
      type: Number,
      default: 5, // Nivel para generar alertas de bajo stock
    },

    // Categoría del ítem
    type: {
      type: String,
      enum: ["material", "equipment", "tool"],
      default: "material",
    },
  },
  { timestamps: true }
); // Añade createdAt y updatedAt automáticamente

const InventoryModel =
  mongoose.models?.Inventory || mongoose.model("Inventory", InventorySchema);
export default InventoryModel;
