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

    // Instancias individuales para equipos (solo tipo "equipment")
    // Cada instancia representa un equipo físico con ID único
    instances: [
      {
        uniqueId: {
          type: String,
          required: true,
          unique: true, // ID único global (ej: número de serie)
        },
        serialNumber: {
          type: String,
          sparse: true, // Permite null/undefined
        },
        macAddress: {
          type: String,
          sparse: true,
        },
        status: {
          type: String,
          enum: ["in-stock", "assigned", "installed", "damaged", "retired"],
          default: "in-stock",
        },
        assignedTo: {
          crewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crew",
          },
          orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
          },
          assignedAt: Date,
        },
        installedAt: {
          orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
          },
          installedDate: Date,
          location: String, // Dirección de instalación
        },
        notes: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
); // Añade createdAt y updatedAt automáticamente

// Middleware para validar que instances solo se usa en equipos
InventorySchema.pre("save", function (next) {
  if (this.type !== "equipment" && this.instances && this.instances.length > 0) {
    return next(new Error("El campo 'instances' solo es válido para ítems de tipo 'equipment'"));
  }
  
  // Actualizar currentStock basado en instancias para equipos
  if (this.type === "equipment" && this.instances) {
    this.currentStock = this.instances.length;
  }
  
  next();
});

const InventoryModel =
  mongoose.models?.Inventory || mongoose.model("Inventory", InventorySchema);
export default InventoryModel;
