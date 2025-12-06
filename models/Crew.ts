// models/Crew.ts
import mongoose from "mongoose";

const CrewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ej: "Cuadrilla Norte 1"
    },
    // El líder es el responsable principal, a quien se le suelen asignar las órdenes
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installer",
      required: true,
    },
    // Lista de técnicos que conforman la cuadrilla (incluyendo o excluyendo al líder, según prefieras, recominedo excluirlo aquí para no duplicar data)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Installer",
      },
    ],
    // Vehículos asignados (opcional, útil para logística)
    vehiclesAssigned: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CrewModel = mongoose.models?.Crew || mongoose.model("Crew", CrewSchema);
export default CrewModel;