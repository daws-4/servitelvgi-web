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
      const profilePictureUrl = formData.get('profilePicture') as string;

      if (!profilePictureUrl) {
           console.error('Mobile mode: profilePicture URL is missing');
           return NextResponse.json({ 
            error: "profilePicture URL es requerido en modo mobile" 
          }, { status: 400 });
      }

      console.log('Mobile: Received profilePicture URL:', profilePictureUrl);
      
      // Auto-actualizar el campo profilePicture del instalador
      try {
        const currentInstaller = await getInstallerById(installerId) as any;
        
        if (currentInstaller) {
          // Actualizar el instalador con la URL recibida
          await updateInstaller(installerId, { 
            profilePicture: profilePictureUrl 
          });
          console.log('Mobile: Installer profilePicture updated successfully with URL:', profilePictureUrl);
        } else {
             console.warn('Mobile: Installer not found with ID:', installerId);
             return NextResponse.json({ 
                error: "Instalador no encontrado" 
              }, { status: 404 });
        }
      } catch (updateError) {
        console.error('Error updating installer profilePicture:', updateError);
        return NextResponse.json({ 
            error: "Error actualizando el instalador" 
          }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        mobile: true,
        message: 'Profile picture updated successfully (mobile mode)',
        installer_id: installerId,
        url: profilePictureUrl
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
        // Si ya tenía una foto, eliminarla de PocketBase para no dejar basura
        if (currentInstaller.profilePicture) {
            console.log('Found existing profile picture, attempting to delete from PocketBase...');
            try {
                // URL format: ${PB_URL}/api/files/{collectionId}/{recordId}/{filename}
                const urlParts = currentInstaller.profilePicture.split('/');
                if (urlParts.length >= 3) {
                    const recordId = urlParts[urlParts.length - 2];
                    console.log('Deleting old record with ID:', recordId);
                    await pb.collection('profile_installer').delete(recordId);
                    console.log('Old profile picture deleted successfully');
                }
            } catch (deleteError) {
                console.error('Error deleting old profile picture (non-blocking):', deleteError);
            }
        }
        
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
