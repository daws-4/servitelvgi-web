// models/Installer.js

import mongoose from "mongoose";
import IndividualInventorySchema from "@/models/IndividualInventorySchema.js"; // Importación del submodelo

const InstallerSchema = new mongoose.Schema(
  {
    // Información personal del técnico
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    // Estado y disponibilidad
    status: {
      type: String,
      enum: ["active", "inactive", "on_duty", "off_duty"],
      default: "active",
    },

    // Inventario personal asignado al técnico
    assignedInventory: [IndividualInventorySchema],
  },
  { timestamps: true }
);

const InstallerModel =
  mongoose.models?.Installer || mongoose.model("Installer", InstallerSchema);
export default InstallerModel;
