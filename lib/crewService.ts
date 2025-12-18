import CrewModel from "@/models/Crew";
import InstallerModel from "@/models/Installer";
import OrderModel from "@/models/Order";
import InventoryModel from "@/models/Inventory";
import { connectDB } from "@/lib/db";

export async function createCrew(data: any) {
  await connectDB();
  
  // Create the crew
  const crew = await CrewModel.create(data);
  
  // Automatically assign the leader's currentCrew to this crew
  if (crew.leader) {
    await InstallerModel.findByIdAndUpdate(
      crew.leader,
      { $set: { currentCrew: crew._id } }
    );
  }
  
  // Also update members' currentCrew if they exist
  if (crew.members && crew.members.length > 0) {
    await InstallerModel.updateMany(
      { _id: { $in: crew.members } },
      { $set: { currentCrew: crew._id } }
    );
  }
  
  return crew;
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
  
  // Get the current crew data before update
  const oldCrew = await CrewModel.findById(id).lean() as { 
    _id: any; 
    leader?: any; 
    members?: any[];
    [key: string]: any;
  } | null;
  
  if (!oldCrew) {
    throw new Error('Crew not found');
  }
  
  // Handle leader change with special case for role swaps
  if (data.leader && data.leader !== oldCrew.leader?.toString()) {
    const oldLeaderId = oldCrew.leader?.toString();
    const newLeaderId = data.leader.toString();
    const newMemberIds = (data.members || []).map((m: any) => m.toString());
    
    // Check if old leader is becoming a member
    const oldLeaderBecomingMember = oldLeaderId && newMemberIds.includes(oldLeaderId);
    
    // Remove currentCrew from old leader ONLY if they're not staying as a member
    if (oldLeaderId && !oldLeaderBecomingMember) {
      await InstallerModel.findByIdAndUpdate(
        oldLeaderId,
        { $set: { currentCrew: null } }
      );
    }
    // If old leader is becoming a member, their currentCrew will be handled by member logic
    
    // Assign currentCrew to new leader
    await InstallerModel.findByIdAndUpdate(
      newLeaderId,
      { $set: { currentCrew: id } }
    );
  } else if (data.leader) {
    // Even if leader didn't change, ensure currentCrew is set
    await InstallerModel.findByIdAndUpdate(
      data.leader,
      { $set: { currentCrew: id } }
    );
  }
  
  // Handle members change
  if (data.members) {
    const oldMemberIds = ((oldCrew as any).members || []).map((m: any) => m.toString());
    const newMemberIds = data.members.map((m: any) => m.toString());
    const newLeaderId = data.leader?.toString();
    
    // Remove the new leader from members list if they're in it (role swap scenario)
    const actualNewMemberIds = newLeaderId 
      ? newMemberIds.filter((m: string) => m !== newLeaderId)
      : newMemberIds;
    
    // Find members that were removed (excluding the new leader and old leader who might be becoming a member)
    // IMPORTANT: Exclude new leader from removedMembers to prevent clearing their currentCrew
    const removedMembers = oldMemberIds.filter((m: string) => 
      !actualNewMemberIds.includes(m) && m !== newLeaderId
    );
    
    // Find members that were added
    const addedMembers = actualNewMemberIds.filter((m: string) => !oldMemberIds.includes(m));
    
    // Remove currentCrew from removed members
    if (removedMembers.length > 0) {
      await InstallerModel.updateMany(
        { _id: { $in: removedMembers } },
        { $set: { currentCrew: null } }
      );
    }
    
    // Assign currentCrew to added members (including old leader if they became a member)
    if (addedMembers.length > 0) {
      await InstallerModel.updateMany(
        { _id: { $in: addedMembers } },
        { $set: { currentCrew: id } }
      );
    }
    
    // Update data.members to exclude the leader
    data.members = actualNewMemberIds;
  }

  
  // Update the crew
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
