// models/Recovery.ts
// Modelo para órdenes de recuperación de equipos ONT de servicios dados de baja
// Este es un tipo de orden INDEPENDIENTE que NO se integra con el inventario de la empresa

import mongoose from "mongoose";

export interface IRecovery {
  _id?: string;
  
  // --- Información del Técnico ---
  recoveredBy: mongoose.Schema.Types.ObjectId | any; // Referencia a Crew que realizó la recuperación
  
  // --- Información del Equipo ONT Recuperado ---
  equipment: {
    serialNumber?: string; // Serial del ONT (puede no existir en inventario)
    macAddress?: string; // MAC del ONT
    model?: string; // Modelo del equipo (ej: "ZTE F670L", "Huawei HG8245H")
    brand?: string; // Marca (ej: "ZTE", "Huawei", "Nokia")
    condition: "functional" | "damaged" | "unknown"; // Estado del equipo recuperado
    hasAccessories: boolean; // Si incluye fuente de poder, cables, etc.
    accessoriesNotes?: string; // Detalles de accesorios recuperados
    notes?: string; // Observaciones adicionales del equipo
  };
  
  // --- Información del Servicio/Abonado ---
  subscriber: {
    subscriberNumber?: string; // Número de abonado
    subscriberName?: string; // Nombre del cliente
    address: string; // Dirección donde se recuperó
    phones?: string[]; // Teléfonos de contacto
    email?: string; // Correo electrónico
    node?: string; // Nodo del servicio
  };
  
  // --- Detalles de la Recuperación ---
  recoveryDate: Date; // Fecha cuando se recuperó el equipo
  reason: "service-cancellation" | "equipment-change" | "technical-failure" | "migration" | "other"; // Motivo de recuperación
  reasonDetails?: string; // Detalles adicionales del motivo
  
  // --- Ubicación GPS ---
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  
  // --- Evidencia Fotográfica ---
  photoEvidence?: string[]; // URLs de fotos del equipo recuperado
  
  // --- Firma del Cliente ---
  customerSignature?: string; // URL de la firma confirmando entrega del equipo
  
  // --- Estado de la Orden de Recuperación ---
  status: "pending" | "completed" | "cancelled"; // Estado de la orden de recuperación
  completionDate?: Date; // Fecha de completado
  
  // --- Notas Adicionales ---
  notes?: string; // Notas generales sobre la recuperación
  
  createdAt?: Date;
  updatedAt?: Date;
}

const RecoverySchema = new mongoose.Schema(
  {
    // --- Información del Técnico ---
    recoveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
      required: true,
    },
    
    // --- Información del Equipo ONT Recuperado ---
    equipment: {
      serialNumber: {
        type: String,
        trim: true,
        uppercase: true, // Normalizar a mayúsculas
      },
      macAddress: {
        type: String,
        trim: true,
        uppercase: true,
      },
      model: {
        type: String,
        trim: true,
      },
      brand: {
        type: String,
        trim: true,
      },
      condition: {
        type: String,
        enum: ["functional", "damaged", "unknown"],
        default: "unknown",
        required: true,
      },
      hasAccessories: {
        type: Boolean,
        default: false,
      },
      accessoriesNotes: {
        type: String,
      },
      notes: {
        type: String,
      },
    },
    
    // --- Información del Servicio/Abonado ---
    subscriber: {
      subscriberNumber: {
        type: String,
        trim: true,
      },
      subscriberName: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      phones: {
        type: [String],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      node: {
        type: String,
        trim: true,
      },
    },
    
    // --- Detalles de la Recuperación ---
    recoveryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reason: {
      type: String,
      enum: ["service-cancellation", "equipment-change", "technical-failure", "migration", "other"],
      default: "service-cancellation",
      required: true,
    },
    reasonDetails: {
      type: String,
    },
    
    // --- Ubicación GPS ---
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    
    // --- Evidencia Fotográfica ---
    photoEvidence: {
      type: [String],
      default: [],
    },
    
    // --- Firma del Cliente ---
    customerSignature: {
      type: String,
    },
    
    // --- Estado de la Orden ---
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
    completionDate: {
      type: Date,
    },
    
    // --- Notas Generales ---
    notes: {
      type: String,
    },
  },
  { 
    timestamps: true,
  }
);

// Índices para búsquedas y rendimiento
RecoverySchema.index({ 'equipment.serialNumber': 1 });
RecoverySchema.index({ 'equipment.macAddress': 1 });
RecoverySchema.index({ 'subscriber.subscriberNumber': 1 });
RecoverySchema.index({ recoveredBy: 1, recoveryDate: -1 });
RecoverySchema.index({ status: 1, recoveryDate: -1 });

// Índice de texto para búsqueda general
RecoverySchema.index({
  'equipment.serialNumber': 'text',
  'equipment.macAddress': 'text',
  'subscriber.subscriberName': 'text',
  'subscriber.subscriberNumber': 'text',
});

// Middleware para validaciones
RecoverySchema.pre("save", function (next) {
  // Guard against missing equipment object
  if (!this.equipment) {
    return next(new Error("Equipment information is required"));
  }
  
  // Validar que al menos tenga serial o MAC
  if (!this.equipment.serialNumber && !this.equipment.macAddress) {
    return next(new Error("Debe proporcionar al menos el Serial Number o MAC Address del equipo"));
  }
  
  // Si el status cambió a "completed" y no tiene fecha de completado, agregarla
  if (this.status === "completed" && !this.completionDate) {
    this.completionDate = new Date();
  }
  
  next();
});

const RecoveryModel =
  mongoose.models?.Recovery || mongoose.model("Recovery", RecoverySchema);

export default RecoveryModel;
