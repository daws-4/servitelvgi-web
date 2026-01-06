// models/Inventory.js

import mongoose from "mongoose";

export interface IInventoryInstance {
  uniqueId: string;
  serialNumber?: string;
  macAddress?: string;
  status: "in-stock" | "assigned" | "installed" | "damaged" | "retired";
  assignedTo?: {
    crewId?: mongoose.Schema.Types.ObjectId;
    orderId?: mongoose.Schema.Types.ObjectId;
    assignedAt?: Date;
  };
  installedAt?: {
    orderId?: mongoose.Schema.Types.ObjectId;
    installedDate?: Date;
    location?: string;
  };
  notes?: string;
  createdAt?: Date;
}

export interface IInventory {
  _id?: string;
  code: string;
  description: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  type: "material" | "equipment" | "tool";
  instances?: IInventoryInstance[];
  createdAt?: Date;
  updatedAt?: Date;
}

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
  
  // Para equipos, SIEMPRE currentStock debe ser igual a instances.length
  if (this.type === "equipment") {
    const calculatedStock = this.instances?.filter((inst: any) => inst.status === 'in-stock').length || 0;
    
    // Si alguien intentó modificar currentStock manualmente, corregir y advertir
    if (this.isModified("currentStock") && this.currentStock !== calculatedStock) {
      console.warn(
        `[Inventory Model] Corrigiendo currentStock para equipo "${this.code}". ` +
        `Valor intentado: ${this.currentStock}, Valor correcto: ${calculatedStock} (basado en instances.length)`
      );
    }
    
    // Forzar el valor correcto
    this.currentStock = calculatedStock;
  }
  
  next();
});

const InventoryModel =
  mongoose.models?.Inventory || mongoose.model("Inventory", InventorySchema);
export default InventoryModel;
