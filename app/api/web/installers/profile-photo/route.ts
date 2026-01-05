import { NextRequest, NextResponse } from "next/server";
import pb, { ensureAuth } from "@/lib/pocketBase";
import { updateInstaller, getInstallerById } from "@/lib/installerService";

// POST: Subir foto de perfil de instalador
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/web/installers/profile-photo - Starting upload...');
    
    const formData = await req.formData();
    const imagen = formData.get('imagen') as File;
    const installerId = formData.get('installer_id') as string;
    const isMobile = formData.get('mobile') === 'true'; // Detectar si viene de mobile

    console.log('Request parameters:', {
      installerId,
      isMobile,
      hasImage: !!imagen
    });

    if (!imagen || !installerId) {
      return NextResponse.json({ 
        error: "imagen e installer_id son requeridos" 
      }, { status: 400 });
    }

    console.log('File details:', {
      name: imagen.name,
      size: imagen.size,
      type: imagen.type
    });

    // Si viene de mobile, omitir PocketBase y solo retornar éxito
    if (isMobile) {
      console.log('Mobile mode detected - skipping PocketBase upload');
      
      // Auto-actualizar el campo profilePicture del instalador si es necesario
      try {
        const currentInstaller = await getInstallerById(installerId) as any;
        
        if (currentInstaller) {
          // Para mobile, podríamos guardar una URL temporal o dejar el campo como está
          // Por ahora solo confirmamos que el instalador existe
          console.log('Mobile: Installer exists, skipping profilePicture update');
        }
      } catch (updateError) {
        console.error('Error checking installer:', updateError);
      }

      return NextResponse.json({ 
        success: true,
        mobile: true,
        message: 'Image received (mobile mode - not uploaded to PocketBase)',
        installer_id: installerId
      });
    }

    // Flujo normal (web): subir a PocketBase
    console.log('Web mode - uploading to PocketBase...');

    // Usar autenticación cacheada
    console.log('Authenticating with PocketBase...');
    await ensureAuth();
    console.log('Authentication successful (cached)');

    // Preparar formData para PocketBase con los nombres correctos
    const pbFormData = new FormData();
    pbFormData.append('image', imagen); // Campo 'image' en PocketBase
    pbFormData.append('user_id', installerId); // Campo 'user_id' en PocketBase

    // Crear registro en PocketBase
    console.log('Creating record in PocketBase collection: profile_installer');
    const record = await pb.collection('profile_installer').create(pbFormData);
    console.log('Created PocketBase record:', record);

    // Extraer filename
    const filename = Array.isArray(record.image) && record.image.length > 0 
      ? record.image[0] 
      : record.image;

    console.log('Extracted filename:', filename);

    // Generar la URL de la imagen
    const imageUrl = `${process.env.NEXT_PUBLIC_PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
    console.log('Generated image URL:', imageUrl);

    // Auto-actualizar el campo profilePicture del instalador
    try {
      console.log('Auto-updating installer profilePicture...');
      
      // Obtener instalador actual
      const currentInstaller = await getInstallerById(installerId) as any;
      
      if (currentInstaller) {
        // Si ya tenía una foto, podríamos eliminar la vieja de PocketBase aquí
        // pero por ahora solo actualizamos con la nueva
        
        // Actualizar el instalador con la nueva URL
        await updateInstaller(installerId, { 
          profilePicture: imageUrl 
        });
        console.log('Installer profilePicture updated successfully');
      }
    } catch (updateError) {
      console.error('Error updating installer profilePicture:', updateError);
      // No falla la subida si falla la actualización
    }

    return NextResponse.json({ 
      success: true, 
      recordId: record.id,
      collectionId: record.collectionId,
      filename: filename,
      url: imageUrl,
      installer_id: record.user_id
    });

  } catch (error: any) {
    console.error("========================================");
    console.error("ERROR in POST /api/web/installers/profile-photo");
    console.error("========================================");
    console.error("Error completo:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      response: error.response,
      url: error.url,
      stack: error.stack,
      name: error.name
    });
    console.error("========================================");
    
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      details: error.response || {},
      status: error.status || 500
    }, { status: 500 });
  }
}

// DELETE: Eliminar foto de perfil
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const installerId = url.searchParams.get("installerId");

    console.log('DELETE /api/web/installers/profile-photo - Request:', { installerId });

    if (!installerId) {
      return NextResponse.json({ 
        error: "installerId es requerido" 
      }, { status: 400 });
    }

    // Usar autenticación cacheada
    await ensureAuth();

    // Obtener el instalador para saber qué foto eliminar
    const installer = await getInstallerById(installerId) as any;
    
    if (installer && installer.profilePicture) {
      // Extraer recordId de la URL si es posible
      // URL format: ${PB_URL}/api/files/{collectionId}/{recordId}/{filename}
      const urlParts = installer.profilePicture.split('/');
      if (urlParts.length >= 3) {
        const recordId = urlParts[urlParts.length - 2];
        
        try {
          // Eliminar de PocketBase (colección profile_installer)
          await pb.collection('profile_installer').delete(recordId);
          console.log('Deleted PocketBase record:', recordId);
        } catch (pbError) {
          console.error('Error deleting from PocketBase:', pbError);
          // Continuar aunque falle la eliminación de PocketBase
        }
      }
    }

    // Actualizar instalador para remover la foto
    await updateInstaller(installerId, { profilePicture: null });
    console.log('Installer profilePicture removed');

    return NextResponse.json({ 
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error: any) {
    console.error("Error eliminando foto de perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
