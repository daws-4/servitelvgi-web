import UserModel from "@/models/User";
import { connectDB } from "@/lib/db";

export async function createUser(data: any) {
  await connectDB();
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
