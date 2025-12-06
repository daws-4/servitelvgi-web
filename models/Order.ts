// models/Order.js
// MODELO ACTUALIZADO BASADO EXCLUSIVAMENTE EN TU IMAGEN REAL

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // --- Datos extraídos por la IA (de la imagen) ---
    // N. Abonado: 368063 (Este es el "subscriberNumber" del que hablas)
    subscriberNumber: {
      type: String, // "N. Abonado" de la imagen
      required: true,
      unique: true, // Asumimos que este es el ID primario de esta orden
    },

    // Tipo de orden (se puede deducir o inferir si no está explícito en el título)
    type: {
      type: String,
      enum: ["instalacion", "averia", "otro"], // "otro" por si no se deduce
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
    servicesToInstall: {
      type: [String], // "Servicios a instalar: Internet, Streaming, FibraNet500_500Mb N°20469486, TelefoníaPon 2767400990, NetUnoGO Plus 3 N°20469487"
    },
    // Nota: 'assignedTechnicianText' no está presente en la imagen

    // --- Datos de Gestión y Cierre (Técnico, no se extraen de esta imagen) ---
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installer",
    },
    receptionDate: {
      type: Date,
      default: Date.now,
    },
    assignmentDate: { type: Date },
    completionDate: { type: Date },

    // Datos del cierre (a rellenar por el técnico)
    reportDetails: { type: String },
    materialsUsed: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        quantity: { type: Number, required: true },
      },
    ],
    digitalSignature: { type: String },
    photoEvidence: [{ type: String }],

    // Control de reporte a Netuno
    googleFormReported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const OrderModel =
  mongoose.models?.Order || mongoose.model("Order", OrderSchema);
export default OrderModel;
