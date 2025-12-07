import InstallerModel from "@/models/Installer";
import { connectDB } from "@/lib/db";

export async function createInstaller(data: any) {
  await connectDB();
  return await InstallerModel.create(data);
}

export async function getInstallers(filters = {}) {
  await connectDB();
  const installers = await InstallerModel.find(filters).sort({ createdAt: -1 }).lean();
  // Transform _id to id for frontend compatibility
  return installers.map((installer: any) => ({
    ...installer,
    id: installer._id.toString(),
  }));
}

export async function getInstallerById(id: string) {
  await connectDB();
  return await InstallerModel.findById(id).lean();
}

export async function updateInstaller(id: string, data: any) {
  await connectDB();
  return await InstallerModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

export async function deleteInstaller(id: string) {
  await connectDB();
  return await InstallerModel.findByIdAndDelete(id).lean();
}
