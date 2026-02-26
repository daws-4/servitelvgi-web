import { NextRequest, NextResponse } from "next/server";
import pb, { ensureAuth } from "@/lib/pocketBase";
import OrderModel from "@/models/Order";

// GET: Obtener URL de imagen usando el SDK de PocketBase
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const recordId = url.searchParams.get("recordId");
    const thumb = url.searchParams.get("thumb"); // "100x100" for thumbnails

    console.log('GET /api/web/orders/uploads - Request:', { recordId, thumb });

    if (!recordId) {
      return NextResponse.json({
        error: "recordId es requerido"
      }, { status: 400 });
    }

    // Usar autenticación cacheada
    await ensureAuth();

    // Obtener el registro de PocketBase
    const record = await pb.collection('evidencias').getOne(recordId);
    console.log('PocketBase record:', record);

    // El campo 'imagen' es un array, tomamos el primer elemento
    const filename = Array.isArray(record.imagen) && record.imagen.length > 0
      ? record.imagen[0]
      : record.imagen;

    console.log('Extracted filename:', filename);

    // Generar la URL manualmente con el formato correcto
    let imageUrl = `${process.env.NEXT_PUBLIC_PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;

    // Add thumbnail parameter if requested
    if (thumb) {
      imageUrl += `?thumb=${thumb}`;
    }

    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({
      success: true,
      url: imageUrl
    });

  } catch (error: any) {
    console.error("Error obteniendo URL de PocketBase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Subir una nueva imagen a PocketBase
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/web/orders/uploads - Starting upload...');
    console.log('PocketBase URL:', process.env.NEXT_PUBLIC_PB_URL);

    const formData = await req.formData();

    // Log file details
    const imagen = formData.get('imagen') as File;
    if (imagen) {
      console.log('File details:', {
        name: imagen.name,
        size: imagen.size,
        type: imagen.type
      });
    }

    // PocketBase espera un FormData directamente
    // El formData debe contener: order_id, installer_id, crew_id y imagen (el archivo)

    // Usar autenticación cacheada (optimización #1)
    console.log('Authenticating with PocketBase...');
    await ensureAuth();
    console.log('Authentication successful (cached)');

    console.log('Creating record in PocketBase...');
    const record = await pb.collection('evidencias').create(formData);
    console.log('Created PocketBase record:', record);

    // El campo 'imagen' puede ser un array o un string, dependiendo de la configuración
    const filename = Array.isArray(record.imagen) && record.imagen.length > 0
      ? record.imagen[0]
      : record.imagen;

    console.log('Extracted filename:', filename);

    // Generar la URL de la imagen (optimización #2 - devolver URL directamente)
    const imageUrl = `${process.env.NEXT_PUBLIC_PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
    console.log('Generated image URL:', imageUrl);

    // Auto-actualizar el campo photoEvidence de la orden
    const orderId = formData.get('order_id') as string;
    if (orderId) {
      try {
        console.log('Auto-updating order photoEvidence with atomic $push...');
        const imageId = `${record.id}:${filename}`;

        // Optimización masiva: Modificación atómica esquivando getOrderById/updateOrder
        await OrderModel.findByIdAndUpdate(orderId, {
          $push: { photoEvidence: imageId }
        });

        console.log('Order photoEvidence updated successfully');
      } catch (updateError) {
        console.error('Error updating order photoEvidence:', updateError);
        // No falla la subida si falla la actualización de la orden
      }
    }

    // Retornar el ID del registro, el nombre del archivo Y la URL
    return NextResponse.json({
      success: true,
      recordId: record.id,
      collectionId: record.collectionId,
      filename: filename,
      url: imageUrl, // ← NUEVA: URL directa
      // También incluimos los IDs guardados
      order_id: record.order_id,
      installer_id: record.installer_id,
      crew_id: record.crew_id
    });

  } catch (error: any) {
    console.error("Error en PocketBase:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      response: error.response,
      url: error.url,
      originalError: error.originalError,
      cause: error.cause
    });

    return NextResponse.json({
      error: error.message || 'Unknown error',
      details: error.response || {},
      status: error.status || 500
    }, { status: 500 });
  }
}

// DELETE: Eliminar imagen de PocketBase
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const recordId = url.searchParams.get("recordId");
    const orderId = url.searchParams.get("orderId"); // NEW: orderId parameter

    console.log('DELETE /api/web/orders/uploads - Request:', { recordId, orderId });

    if (!recordId) {
      return NextResponse.json({
        error: "recordId es requerido"
      }, { status: 400 });
    }

    // Usar autenticación cacheada
    await ensureAuth();

    // Obtener el registro antes de eliminarlo para obtener el filename
    const record = await pb.collection('evidencias').getOne(recordId);
    const filename = Array.isArray(record.imagen) && record.imagen.length > 0
      ? record.imagen[0]
      : record.imagen;
    const imageId = `${recordId}:${filename}`;

    // Eliminar el registro de PocketBase
    await pb.collection('evidencias').delete(recordId);
    console.log('Deleted PocketBase record:', recordId);

    // Auto-actualizar el campo photoEvidence de la orden
    if (orderId) {
      try {
        console.log('Auto-updating order photoEvidence after deletion with atomic $pull...');

        // Optimización masiva: Remover imagen atómicamente  esquivando updateOrder
        await OrderModel.findByIdAndUpdate(orderId, {
          $pull: { photoEvidence: imageId }
        });

        console.log('Order photoEvidence updated after deletion');
      } catch (updateError) {
        console.error('Error updating order photoEvidence:', updateError);
        // No falla la eliminación si falla la actualización de la orden
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error("Error eliminando de PocketBase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}