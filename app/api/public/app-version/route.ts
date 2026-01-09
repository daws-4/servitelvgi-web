import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Apk, { IApk } from '@/models/Apk';

/**
 * GET /api/public/app-version
 * Endpoint público para obtener la última versión activa de la aplicación desde MongoDB
 * No requiere autenticación
 */
export async function GET() {
  try {
    await connectDB();

    // Obtener la última versión activa ordenada por version_code descendente
    const latestVersion = await Apk.findOne({ is_active: true })
      .sort({ version_code: -1 })
      .lean() as IApk | null;

    if (!latestVersion || Array.isArray(latestVersion)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay versiones disponibles en este momento' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(latestVersion._id),
        version: latestVersion.version,
        versionCode: latestVersion.version_code,
        downloadUrl: latestVersion.download_url,
        releaseNotes: latestVersion.release_notes || '',
        forceUpdate: latestVersion.force_update || false,
        minAndroidVersion: latestVersion.min_android_version || 21,
        publishedDate: latestVersion.created_at,
        fileSize: 'N/A', // Ya no tenemos file_size en el modelo
      },
    });
  } catch (error: any) {
    console.error('Error fetching latest app version:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener la versión de la aplicación' 
      },
      { status: 500 }
    );
  }
}
