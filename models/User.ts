// models/User.ts

import mongoose from "mongoose";

// TypeScript interface for User
export interface IUser {
  _id?: string;
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
  role: "admin" | "installer";
  installerRef?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new mongoose.Schema(
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
    },
    role: {
      type: String,
      enum: ["admin", "installer"],
      default: "installer",
    },

    // Vínculo con el modelo Installer (si el rol es 'installer')
    installerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installer",
      required: function () {
        return this.role === "installer";
      }, // Requerido solo para instaladores
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError when using hot-reload / multiple imports
const UserModel = mongoose.models?.User || mongoose.model("User", UserSchema);
export default UserModel;
