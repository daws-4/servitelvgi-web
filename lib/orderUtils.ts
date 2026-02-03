import { OrderEditData } from '@/components/orders/OrderEditForm';

export const transformOrderToEditData = (order: any): OrderEditData => {
    // Helper to safely parse strings or arrays
    const parseStringOrArray = (val: any) => {
        if (Array.isArray(val)) return val.join(', ');
        return val || '';
    };

    return {
        subscriberNumber: order.subscriberNumber || '',
        ticket_id: order.ticket_id || '',
        subscriberName: order.subscriberName || '',
        phones: parseStringOrArray(order.phones),
        email: order.email || '',
        address: order.address || '',
        node: order.node || '',
        servicesToInstall: parseStringOrArray(order.servicesToInstall),
        type: order.type || 'instalacion',
        status: order.status || 'pending',
        assignedTo: order.assignedTo?._id || (typeof order.assignedTo === 'string' ? order.assignedTo : undefined),
        technicianName: (order.assignedTo && typeof order.assignedTo === 'object' && order.assignedTo.leader)
            ? `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname}`
            : undefined,
        materialsUsed: order.materialsUsed || [],
        photoEvidence: order.photoEvidence || [],
        internetTest: order.internetTest || undefined,
        customerSignature: order.customerSignature || undefined,
        installerLog: order.installerLog || [],
        equipmentRecovered: order.equipmentRecovered,
        updatedAt: order.updatedAt,
        visitCount: order.visitCount || 0,
        powerNap: order.powerNap || '',
        powerRoseta: order.powerRoseta || '',
        remainingPorts: order.remainingPorts || undefined,
        etiqueta: order.etiqueta || undefined,
        sentToNetuno: order.sentToNetuno || false,
        serialNap: order.serialNap || '',
        usedPort: order.usedPort || '',
    };
};
