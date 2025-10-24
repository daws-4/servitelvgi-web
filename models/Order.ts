// models/Order.js

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // Datos principales de la orden
    netunoId: {
      type: String,
      required: true,
      unique: true, // ID proporcionado por Netuno
    },
    type: {
      type: String,
      enum: ["averia", "instalacion"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    // Datos del cliente/servicio
    subscriberName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },

    // Asignación y fechas clave
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installer",
    },
    receptionDate: {
      type: Date,
      default: Date.now, // Fecha de ingreso al sistema
    },
    assignmentDate: { type: Date },
    completionDate: { type: Date },

    // Datos del cierre de la orden (a rellenar por el técnico)
    reportDetails: { type: String },
    materialsUsed: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        quantity: { type: Number, required: true },
      },
    ],
    digitalSignature: { type: String }, // URL a la imagen de la firma
    photoEvidence: [{ type: String }], // Array de URLs de las fotos
    gpsLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

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
