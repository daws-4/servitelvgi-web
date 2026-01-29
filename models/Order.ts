// models/Order.js
// MODELO ACTUALIZADO BASADO EXCLUSIVAMENTE EN TU IMAGEN REAL

import mongoose from "mongoose";

export interface IOrder {
  _id?: string;
  subscriberNumber?: string;
  ticket_id?: string;
  type: "instalacion" | "averia" | "recuperacion" | "otro";
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "visita";
  subscriberName: string;
  address: string;
  phones?: string[];
  email?: string;
  node?: string;
  servicesToInstall?: string[]; // Para instalación/avería
  assignedTo?: mongoose.Schema.Types.ObjectId | any;
  receptionDate?: Date;
  assignmentDate?: Date;
  completionDate?: Date;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  installerLog?: {
    timestamp: Date;
    log: string;
    status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "visita";
  }[];
  materialsUsed?: {
    item: mongoose.Schema.Types.ObjectId | any;
    quantity: number;
    batchCode?: string;
    instanceIds?: string[];
    // Helper property for populated data (not in DB)
    instanceDetails?: { uniqueId: string; serialNumber: string }[];
  }[];
  // Datos del equipo ONT recuperado (solo para type: "recuperacion")
  equipmentRecovered?: {
    ontId: string; // ID de la ONT ingresado por el instalador
    serialNumber?: string;
    macAddress?: string;
    model?: string;
    condition?: "good" | "damaged" | "defective";
    notes?: string;
  };
  photoEvidence?: string[];
  customerSignature?: string; // No aplica para recuperación
  internetTest?: {
    downloadSpeed?: number;
    uploadSpeed?: number;
    ping?: number;
    provider?: string;
    wifiSSID?: string;
    frecuency?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  }; // No aplica para recuperación
  googleFormReported?: boolean;
  certificateUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  visitCount?: number;
  powerNap?: string;
  powerRoseta?: string;
  remainingPorts?: number;
  etiqueta?: {
    color: "verde" | "rojo" | "azul";
    numero: number;
  };
}

// Removed duplicate fields below


const OrderSchema = new mongoose.Schema(
  {
    // --- Datos extraídos por la IA (de la imagen) ---
    // N. Abonado: 368063 (Este es el "subscriberNumber" del que hablas)
    subscriberNumber: {
      type: String, // "N. Abonado" de la imagen
      required: true,
    },
    ticket_id: {
      type: String,
    },
    // Tipo de orden (se puede deducir o inferir si no está explícito en el título)
    type: {
      type: String,
      enum: ["instalacion", "averia", "recuperacion", "otro"],
      default: "otro",
      required: true,
    },

    // Status del Abonado: Denegado (No lo podemos insertar directamente en 'status' de la orden)
    // Status de la Orden: Pendiente (Este sí es el 'status' de la orden)
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
        "hard",
        "visita",
        // Aquí puedes añadir otros estados si aparecen en otras imágenes,
        // por ahora "Pendiente" es lo más claro
      ],
      default: "pending",
    },

    // --- Datos del Abonado ---
    subscriberName: {
      type: String,
      required: true, // "Nombre: DANIEL GEU HERNANDEZ CHACON"
    },
    // Nota: 'subscriberId' (C.I.) no está presente en la imagen

    address: {
      type: String,
      required: true, // "Direccion: MUNICIPIO CÁRDENAS..."
    },
    // Nota: 'referencePoint' no está presente en la imagen

    phones: {
      type: [String], // "Teléfonos: 4247617337,4247617337" (Cambiado a Array)
    },
    email: {
      type: String, // "Correo: hernandeztrillosdaniel@gmail.com"
    },

    // --- Datos Técnicos de la Orden ---
    node: {
      type: String, // "Nodo: SCRVEG20112A-GPON TAR29A"
    },
    powerNap: { type: String },
    powerRoseta: { type: String },
    remainingPorts: { type: Number },
    servicesToInstall: {
      type: [String], // Para instalación/avería
    },
    // Nota: 'assignedTechnicianText' no está presente en la imagen

    // --- Datos de Gestión y Cierre (Técnico, no se extraen de esta imagen) ---
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
    },
    receptionDate: {
      type: Date,
      default: Date.now,
    },
    assignmentDate: { type: Date },
    completionDate: { type: Date },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    // Bitácora de instaladores
    installerLog: [
      {
        timestamp: { type: Date, default: Date.now },
        log: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "assigned", "in_progress", "completed", "cancelled", "visita"],
          required: true,
        },
      },
    ],
    materialsUsed: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        quantity: { type: Number, required: true },
        batchCode: { type: String }, // Optional: identifies specific bobbin used
        instanceIds: { type: [String], default: [] }, // Optional: identifies specific equipment instances used
      },
    ],

    // --- Datos del equipo ONT recuperado (solo para type: "recuperacion") ---
    equipmentRecovered: {
      ontId: {
        type: String,
        // Required when type is "recuperacion"
      },
      serialNumber: { type: String },
      macAddress: { type: String },
      model: { type: String },
      condition: {
        type: String,
        enum: ["good", "damaged", "defective"],
      },
      notes: { type: String },
    },

    // Evidencia fotográfica (Array de URLs de las imágenes subidas)
    photoEvidence: {
      type: [String],
      default: [],
    },

    customerSignature: {
      type: String,
    },
    internetTest: {
      downloadSpeed: { type: Number },
      uploadSpeed: { type: Number },
      ping: { type: Number },
      provider: { type: String },
      wifiSSID: { type: String },
      frecuency: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },

    // Control de reporte a Netuno
    googleFormReported: {
      type: Boolean,
      default: false,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    certificateUrl: {
      type: String,
    },
    etiqueta: {
      color: {
        type: String,
        enum: ["verde", "rojo", "azul"],
      },
      numero: {
        type: Number,
      },
    },
  },
  { timestamps: true }
);

const OrderModel =
  mongoose.models?.Order || mongoose.model("Order", OrderSchema);
export default OrderModel;
