import { NextRequest, NextResponse } from 'next/server';
import pb, { ensureAuth } from "@/lib/pocketBase";
import { updateOrder } from '@/lib/orderService';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const orderId = formData.get('order_id') as string;
        const image = formData.get('image');
        const isMobile = formData.get('mobile') === 'true';

        console.log('POST /api/web/upload/signature - Request:', { orderId, isMobile });

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Mobile flow: Image is already uploaded to PB by the mobile app
        if (isMobile) {
            const signatureUrl = formData.get('signature_url') as string;
            
            if (!signatureUrl) {
                return NextResponse.json(
                    { error: 'Signature URL is required for mobile requests' },
                    { status: 400 }
                );
            }

            console.log('Mobile mode: Updating order with signature URL:', signatureUrl);

            // Update order with signature URL
            await updateOrder(orderId, { customerSignature: signatureUrl });

            return NextResponse.json({ 
                success: true, 
                url: signatureUrl,
                mobile: true
            });
        }

        // Web flow: Upload image to PocketBase from server
        console.log('Web mode - uploading to PocketBase...');

        if (!image) {
            return NextResponse.json(
                { error: 'Image is required' },
                { status: 400 }
            );
        }

        // Authenticate with PocketBase
        console.log('Authenticating with PocketBase...');
        await ensureAuth();
        console.log('Authentication successful (cached)');

        // Prepare FormData for PocketBase
        const pbFormData = new FormData();
        pbFormData.append('image', image);
        pbFormData.append('order_id', orderId);

        // Create record in customers_signatures collection
        console.log('Creating record in PocketBase collection: customers_signatures');
        const record = await pb.collection('customers_signatures').create(pbFormData);
        console.log('Created PocketBase record:', record);

        // Get the public URL
        const fileUrl = pb.files.getURL(record, record.image);
        console.log('Generated signature URL:', fileUrl);
        
        // Also update the order record in MongoDB
        console.log('Auto-updating order customerSignature...');
        await updateOrder(orderId, { customerSignature: fileUrl });
        console.log('Order customerSignature updated successfully');

        return NextResponse.json({ 
            success: true, 
            url: fileUrl,
            recordId: record.id,
            collectionId: record.collectionId,
            filename: record.image
        });

    } catch (error: any) {
        console.error("========================================");
        console.error("ERROR in POST /api/web/upload/signature");
        console.error("========================================");
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            name: error.name
        });
        
        return NextResponse.json(
            { error: error.message || 'Failed to upload signature' },
            { status: 500 }
        );
    }
}
// DELETE: Remove customer signature
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const orderId = url.searchParams.get('orderId');

        console.log('DELETE /api/web/upload/signature - Request:', { orderId });

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Authenticate with PocketBase for web flow operations if needed
        await ensureAuth();

        // 1. Get current order to find signature URL
        // We need to fetch the order first to know if there's a signature and what URL it has
        // This is important for deleting the file from PocketBase
        // Since we don't have direct access to MongoDB here without importing OrderModel, 
        // we can try to find the record in PocketBase directly by order_id
        
        try {
            // Try to find the record in PocketBase 'customers_signatures' collection
            const record = await pb.collection('customers_signatures').getFirstListItem(`order_id="${orderId}"`);
            
            if (record) {
                console.log('Found PocketBase record to delete:', record.id);
                await pb.collection('customers_signatures').delete(record.id);
                console.log('Deleted PocketBase record successfully');
            }
        } catch (pbError: any) {
            // If 404, record doesn't exist in PB (maybe it was a mobile upload that only updated the URL)
            // or maybe it's already gone. We proceed to update the Order.
            if (pbError.status !== 404) {
                console.error('Error deleting from PocketBase:', pbError);
                // Non-blocking, continue to update order
            } else {
                console.log('No PocketBase record found or already deleted');
            }
        }

        // 2. Update Order to remove signature URL
        console.log('Updating order to remove signature URL...');
        await updateOrder(orderId, { customerSignature: null });
        console.log('Order signature removed successfully');

        return NextResponse.json({ 
            success: true, 
            message: 'Signature deleted successfully' 
        });

    } catch (error: any) {
        console.error("Error deleting signature:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete signature' },
            { status: 500 }
        );
    }
}
