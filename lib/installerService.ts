import InstallerModel from "@/models/Installer";
import CrewModel from "@/models/Crew"; // Import to register the schema
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

// Función reutilizable para CREAR instalador
export async function createInstaller(data: any) {
  await connectDB();
  
  const { username, password, email, surname, name, phone, status, currentCrew, showInventory } = data;
  
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
      showInventory,
      currentCrew: currentCrew
    });
    
    return installer;
  } catch (error: any) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'username') {
        throw new Error('El nombre de usuario ya está en uso');
      } else if (field === 'email') {
        throw new Error('El email ya está registrado');
      } else {
        throw new Error('Ya existe un registro con estos datos');
      }
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      throw new Error(messages.join(', '));
    }
    
    // Re-throw any other errors
    throw error;
  }
}

// Función reutilizable para LISTAR instaladores
export async function getInstallers(filters = {}) {
  await connectDB();
  const installers = await InstallerModel.find(filters)
    .populate('currentCrew', 'number') // Populate crew reference with number
    .sort({ createdAt: -1 })
    .lean();
  // Transform _id to id for frontend compatibility
  return installers.map((installer: any) => ({
    ...installer,
    id: installer._id.toString(),
    // Transform currentCrew to just the number if it exists
    currentCrew: installer.currentCrew?.number || null,
  }));
}

export async function getInstallerById(id: string) {
  await connectDB();
  const installer = await InstallerModel.findById(id)
    .populate('currentCrew', 'number') // Populate crew reference with number
    .lean();
  if (!installer) return null;
  
  // Cast to ensure TypeScript knows this is a single document, not an array
  const installerDoc = installer as any;
  
  // Transform _id to id for frontend compatibility
  // Keep the currentCrew._id for the edit form to work properly
  return {
    ...installerDoc,
    _id: installerDoc._id.toString(),
    id: installerDoc._id.toString(),
    // For edit form, we need the crew ID, not the name
    currentCrew: installerDoc.currentCrew?._id?.toString() || null,
  };
}

export async function updateInstaller(id: string, data: any) {
  await connectDB();
  
  try {
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
      { new: true, runValidators: true } // Added runValidators to catch validation errors
    ).lean();
    
    if (!updatedInstaller) return null;     
    
    // Cast to ensure TypeScript knows this is a single document, not an array
    const installerDoc = updatedInstaller as any;
    
    // Transform _id to id for frontend compatibility
    return {
      ...installerDoc,
      id: installerDoc._id.toString(),
    };
  } catch (error: any) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'username') {
        throw new Error('El nombre de usuario ya está en uso');
      } else if (field === 'email') {
        throw new Error('El email ya está registrado');
      } else {
        throw new Error('Ya existe un registro con estos datos');
      }
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      throw new Error(messages.join(', '));
    }
    
    // Re-throw any other errors
    throw error;
  }
}

export async function deleteInstaller(id: string) {
  await connectDB();
  return await InstallerModel.findByIdAndDelete(id).lean();
}
