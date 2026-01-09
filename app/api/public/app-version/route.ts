import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

/**
 * GET /api/public/app-version
 * Endpoint público para obtener la última versión activa de la aplicación
 * No requiere autenticación
 */
export async function GET() {
  try {
    // Crear instancia de PocketBase sin autenticación
    const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');

    // Obtener la última versión activa
    const latestVersion = await pb.collection('app_versions').getFirstListItem(
      'is_active = true',
      {
        sort: '-version_code',
      }
    );

    // Generar URL pública de descarga del APK
    const downloadUrl = pb.files.getURL(latestVersion, latestVersion.apk_file);

    // Calcular tamaño del archivo si está disponible
    const fileSize = latestVersion.apk_file ? 
      `${(latestVersion.expand?.apk_file?.size / (1024 * 1024)).toFixed(2)} MB` : 
      'N/A';

    return NextResponse.json({
      success: true,
      data: {
        id: latestVersion.id,
        version: latestVersion.version,
        versionCode: latestVersion.version_code,
        downloadUrl,
        releaseNotes: latestVersion.release_notes || '',
        forceUpdate: latestVersion.force_update || false,
        minAndroidVersion: latestVersion.min_android_version || 21,
        publishedDate: latestVersion.created,
        fileSize,
      },
    });
  } catch (error: any) {
    console.error('Error fetching latest app version:', error);

    // Si no hay versiones activas
    if (error?.status === 404) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay versiones disponibles en este momento' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener la versión de la aplicación' 
      },
      { status: 500 }
    );
  }
}
