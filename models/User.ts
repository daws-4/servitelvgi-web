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
  phoneNumber?: string;
  role: "admin";
  isActive: boolean;
  isAutopilot?: boolean;
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
    phoneNumber: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isAutopilot: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError when using hot-reload / multiple imports
const UserModel = mongoose.models?.User || mongoose.model("User", UserSchema);
export default UserModel;
