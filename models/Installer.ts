// models/Installer.ts

import mongoose from "mongoose";

const InstallerSchema = new mongoose.Schema(
  {
        // Credenciales de acceso
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Información y rol del usuario
     name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    showInventory:{
      type:Boolean,
      default:false
    },
    onDuty:{
      type:Boolean,
      default:false
    },
    profilePicture:{
      type:String,
      default:null
    },
    // Referencia a la cuadrilla actual. Si es null, trabaja solo.
    currentCrew: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
      default: null
    },
  },
  { timestamps: true }
);

const InstallerModel =
  mongoose.models?.Installer || mongoose.model("Installer", InstallerSchema);
export default InstallerModel;