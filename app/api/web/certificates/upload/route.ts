import { NextRequest, NextResponse } from 'next/server';
import { updateOrder } from '@/lib/orderService';
import pb, { ensureAuth } from "@/lib/pocketBase";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const orderId = formData.get('orderId') as string;
        const ticketId = formData.get('ticketId') as string;
        const image = formData.get('image') as File;

        if (!orderId || !ticketId || !image) {
            return NextResponse.json(
                { error: 'Missing required fields (orderId, ticketId, image)' },
                { status: 400 }
            );
        }

        console.log(`[UPLOAD] Processing certificate for Order: ${orderId}, Ticket: ${ticketId}`);

        // 1. Authenticate with PocketBase
        console.log('[UPLOAD] Authenticating with PocketBase...');
        await ensureAuth();

        // 2. Check if a certificate already exists for this ticket (to Replace/Overwrite)
        try {
            // Trying to find by ticket_id filter
            // Assuming the collection 'certificates' has a field 'ticket_id'
            const existingRecords = await pb.collection('certificates').getList(1, 1, {
                filter: `ticket_id = "${ticketId}"`
            });

            if (existingRecords.items.length > 0) {
                const oldRecordId = existingRecords.items[0].id;
                console.log(`[UPLOAD] Found existing certificate ${oldRecordId} for ticket ${ticketId}. Deleting...`);
                await pb.collection('certificates').delete(oldRecordId);
            }
        } catch (err) {
            // Ignore error if search fails/collection doesn't exist yet, we'll try to create anyway
            console.warn('[UPLOAD] Warning checking existing records:', err);
        }

        // 3. Upload to PocketBase
        const pbFormData = new FormData();
        pbFormData.append('image', image);
        pbFormData.append('ticket_id', ticketId);
        pbFormData.append('order_id', orderId);

        console.log('[UPLOAD] Creating record in PocketBase collection: certificates');
        const record = await pb.collection('certificates').create(pbFormData);

        // 4. Construct Public URL
        // Format: [HOST]/api/files/[COLLECTION_ID]/[RECORD_ID]/[FILENAME]
        const publicUrl = pb.files.getURL(record, record.image);
        console.log(`[UPLOAD] Generated PocketBase URL: ${publicUrl}`);

        // 5. Update MongoDB Order
        console.log(`[UPLOAD] Attempting to update order ${orderId} with URL ${publicUrl}`);
        const updated = await updateOrder(orderId, { certificateUrl: publicUrl });
        console.log(`[UPLOAD] Order updated result:`, updated?.certificateUrl ? 'Success' : 'Failed');

        return NextResponse.json({
            success: true,
            url: publicUrl
        });

    } catch (error: any) {
        console.error('[UPLOAD] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload certificate to PocketBase' },
            { status: 500 }
        );
    }
}
