import CrewModel from "@/models/Crew";
import InstallerModel from "@/models/Installer";
import OrderModel from "@/models/Order";
import { connectDB } from "@/lib/db";

export async function createCrew(data: any) {
  await connectDB();
  return await CrewModel.create(data);
}

export async function getCrews(filters = {}) {
  await connectDB();
  return await CrewModel.find(filters)
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .sort({ createdAt: -1 });
}

export async function getCrewById(id: string) {
  await connectDB();
  return await CrewModel.findById(id)
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .populate('assignedInventory.item', 'code description unit')
    .lean();
}

export async function updateCrew(id: string, data: any) {
  await connectDB();
  return await CrewModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  )
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .lean();
}

export async function deleteCrew(id: string) {
  await connectDB();
  
  try {
    // Step 1: Clean up references in installers - set currentCrew to null for all installers in this crew
    const installersUpdate = await InstallerModel.updateMany(
      { currentCrew: id },
      { $set: { currentCrew: null } }
    );
    
    console.log(`[deleteCrew] Updated ${installersUpdate.modifiedCount} installers, removed crew reference`);
    
    // Step 2: Clean up references in orders - set assignedTo to null for all orders assigned to this crew
    const ordersUpdate = await OrderModel.updateMany(
      { assignedTo: id },
      { $set: { assignedTo: null } }
    );
    
    console.log(`[deleteCrew] Updated ${ordersUpdate.modifiedCount} orders, removed crew assignment`);
    
    // Step 3: Delete the crew document
    const deletedCrew = await CrewModel.findByIdAndDelete(id).lean();
    
    if (deletedCrew && 'name' in deletedCrew) {
      console.log(`[deleteCrew] Successfully deleted crew: ${deletedCrew.name} (ID: ${id})`);
    }
    
    return deletedCrew;
  } catch (error) {
    console.error(`[deleteCrew] Error during cascade deletion for crew ID ${id}:`, error);
    throw error;
  }
}
