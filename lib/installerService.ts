import InstallerModel from "@/models/Installer";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

// Función reutilizable para CREAR instalador
export async function createInstaller(data: any) {
  await connectDB();
  
  const { username, password, email, surname, name, phone, status, currentCrew } = data;
  
  try {
    // 1. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Create Installer with all fields including credentials
    const installer = await InstallerModel.create({
      username,
      password: hashedPassword,
      email,
      surname,
      name,
      phone,
      status,
      currentCrew: currentCrew || null,
    });
    
    return installer;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error('El nombre de usuario o email ya existe');
    }
    throw error;
  }
}

// Función reutilizable para LISTAR instaladores
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
  const installer = await InstallerModel.findById(id).lean();
  if (!installer) return null;
  // Transform _id to id for frontend compatibility
  return {
    ...installer,
    id: installer._id.toString(),
  };
}

export async function updateInstaller(id: string, data: any) {
  await connectDB();
  
  const updateData = { ...data };
  
  // Hash password if it's being updated
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  } else {
    // Remove password from update if not provided
    delete updateData.password;
  }
  
  const updatedInstaller = await InstallerModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean();
  
  if (!updatedInstaller) return null;
  
  // Transform _id to id for frontend compatibility
  return {
    ...updatedInstaller,
    id: updatedInstaller._id.toString(),
  };
}

export async function deleteInstaller(id: string) {
  await connectDB();
  return await InstallerModel.findByIdAndDelete(id).lean();
}
