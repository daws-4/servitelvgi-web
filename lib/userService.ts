import UserModel from "@/models/User";
import { connectDB } from "@/lib/db";

import bcrypt from "bcryptjs";

function normalizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return phone;
  const digits = String(phone).replace(/\D/g, "");
  
  if (digits.startsWith("0")) {
    return "58" + digits.substring(1);
  } else if (!digits.startsWith("58") && digits.length === 10) {
    return "58" + digits;
  }
  
  return digits;
}

export async function createUser(data: any) {
  await connectDB();
  if (data.phoneNumber) {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
  }
  
  // Hash password with bcryptjs
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return await UserModel.create(data);
}

export async function getUsers(filters = {}) {
  await connectDB();
  return await UserModel.find(filters).sort({ createdAt: -1 });
}

export async function getUserById(id: string) {
  await connectDB();
  return await UserModel.findById(id).lean();
}

export async function updateUser(id: string, data: any) {
  await connectDB();
  if (data.phoneNumber !== undefined) {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
  }
  
  // Hash password if modified
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return await UserModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

export async function deleteUser(id: string) {
  await connectDB();
  return await UserModel.findByIdAndDelete(id).lean();
}

