import { NextRequest, NextResponse } from "next/server";
import pb from "@/lib/pocketBase";

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

    // Autenticación como superusuario (PocketBase v0.23.0+)
    await pb.collection("_superusers").authWithPassword(
        process.env.PB_ADMIN_EMAIL!, 
        process.env.PB_ADMIN_PASS!
    );

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
    
    console.log('Authenticating with PocketBase...');
    // Autenticación como superusuario (PocketBase v0.23.0+)
    try {
      await pb.collection("_superusers").authWithPassword(
          process.env.PB_ADMIN_EMAIL!, 
          process.env.PB_ADMIN_PASS!
      );
      console.log('Authentication successful');
    } catch (authError: any) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Failed to authenticate with PocketBase',
        details: authError.message 
      }, { status: 500 });
    }

    console.log('Creating record in PocketBase...');
    const record = await pb.collection('evidencias').create(formData);
    console.log('Created PocketBase record:', record);

    // El campo 'imagen' puede ser un array o un string, dependiendo de la configuración
    const filename = Array.isArray(record.imagen) && record.imagen.length > 0 
      ? record.imagen[0] 
      : record.imagen;

    console.log('Extracted filename:', filename);

    // Retornar el ID del registro y el nombre del archivo
    return NextResponse.json({ 
      success: true, 
      recordId: record.id,
      collectionId: record.collectionId,
      filename: filename,
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

    console.log('DELETE /api/web/orders/uploads - Request:', { recordId });

    if (!recordId) {
      return NextResponse.json({ 
        error: "recordId es requerido" 
      }, { status: 400 });
    }

    // Autenticación como superusuario (PocketBase v0.23.0+)
    await pb.collection("_superusers").authWithPassword(
        process.env.PB_ADMIN_EMAIL!, 
        process.env.PB_ADMIN_PASS!
    );

    // Eliminar el registro de PocketBase
    await pb.collection('evidencias').delete(recordId);
    console.log('Deleted PocketBase record:', recordId);

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error("Error eliminando de PocketBase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}