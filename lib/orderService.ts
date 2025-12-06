import OrderModel from "@/models/Order";
import { connectDB } from "@/lib/db";

// Función reutilizable para CREAR ordenes
export async function createOrder(data: any) {
  await connectDB();
  // Aquí validas lógica de negocio (ej: verificar si el técnico existe)
  const newOrder = await OrderModel.create(data);
  return newOrder;
}

// Función reutilizable para LISTAR ordenes
export async function getOrders(filters = {}) {
  await connectDB();
  return await OrderModel.find(filters).sort({ createdAt: -1 });
}

// Obtener una orden por id
export async function getOrderById(id: string) {
  await connectDB();
  return await OrderModel.findById(id).populate('assignedTo', 'name surname role').lean();
}

// Actualizar orden por id
export async function updateOrder(id: string, data: any) {
  await connectDB();
  return await OrderModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

// Eliminar orden por id
export async function deleteOrder(id: string) {
  await connectDB();
  return await OrderModel.findByIdAndDelete(id).lean();
}
