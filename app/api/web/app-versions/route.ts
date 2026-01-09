import { NextRequest, NextResponse } from 'next/server';
import { ensureAuth } from '@/lib/pocketBase';
import {connectDB} from '@/lib/db';
import Apk from '@/models/Apk';

export const dynamic = 'force-dynamic';


/**
 * GET /api/web/app-versions
 * Lista todas las versiones APK disponibles desde MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    await ensureAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');
    const sortParam = searchParams.get('sort') || '-version_code';

    // Convertir formato de sort de PocketBase a MongoDB
    const sortField = sortParam.startsWith('-') ? sortParam.substring(1) : sortParam;
    const sortOrder = sortParam.startsWith('-') ? -1 : 1;

    // Calcular skip para paginación
    const skip = (page - 1) * perPage;

    // Obtener total de documentos
    const totalItems = await Apk.countDocuments();
    const totalPages = Math.ceil(totalItems / perPage);

    // Obtener documentos paginados
    const items = await Apk.find()
      .sort([[sortField, sortOrder]])
      .skip(skip)
      .limit(perPage)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item: any) => ({
          ...item,
          id: item._id.toString(),
          _id: undefined,
        })),
        page,
        perPage,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching app versions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las versiones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/web/app-versions
 * Crea una nueva versión APK - Guarda metadata con download_url en MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    await ensureAuth();
    await connectDB();

    const body = await request.json();
    const { version, version_code, download_url, release_notes, is_active, force_update, min_android_version } = body;

    // Validaciones
    if (!version || !version_code || !download_url) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: version, version_code, download_url' },
        { status: 400 }
      );
    }

    // Validar que download_url sea una URL válida
    try {
      new URL(download_url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'La URL de descarga no es válida' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una versión con ese número o código
    const existingVersion = await Apk.findOne({
      $or: [
        { version: version },
        { version_code: parseInt(version_code) }
      ]
    });

    if (existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una versión con ese número o código' },
        { status: 400 }
      );
    }

    // Crear documento en MongoDB
    const apkDocument = new Apk({
      version,
      version_code: parseInt(version_code),
      download_url,
      release_notes: release_notes || '',
      is_active: is_active ?? true,
      force_update: force_update ?? false,
      min_android_version: min_android_version ? parseInt(min_android_version) : 21,
    });

    await apkDocument.save();

    console.log('APK metadata saved to MongoDB:', apkDocument._id);

    return NextResponse.json({
      success: true,
      data: {
        id: apkDocument._id.toString(),
        version: apkDocument.version,
        version_code: apkDocument.version_code,
        download_url: apkDocument.download_url,
        release_notes: apkDocument.release_notes,
        is_active: apkDocument.is_active,
        force_update: apkDocument.force_update,
        min_android_version: apkDocument.min_android_version,
        created_at: apkDocument.created_at,
        updated_at: apkDocument.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating app version:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear la versión' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/web/app-versions
 * Actualiza una versión existente (sin cambiar el APK en Drive)
 */
export async function PATCH(request: NextRequest) {
  try {
    await ensureAuth();
    await connectDB();

    const body = await request.json();
    const { id, release_notes, is_active, force_update, min_android_version } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de versión requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (release_notes !== undefined) updateData.release_notes = release_notes;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (force_update !== undefined) updateData.force_update = force_update;
    if (min_android_version !== undefined) updateData.min_android_version = min_android_version;

    const updatedApk = await Apk.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedApk) {
      return NextResponse.json(
        { success: false, error: 'Versión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApk._id.toString(),
        version: updatedApk.version,
        version_code: updatedApk.version_code,
        download_url: updatedApk.download_url,
        release_notes: updatedApk.release_notes,
        is_active: updatedApk.is_active,
        force_update: updatedApk.force_update,
        min_android_version: updatedApk.min_android_version,
        created_at: updatedApk.created_at,
        updated_at: updatedApk.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating app version:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la versión' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/web/app-versions
 * Elimina una versión APK de MongoDB
 */
export async function DELETE(request: NextRequest) {
  try {
    await ensureAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de versión requerido' },
        { status: 400 }
      );
    }

    // Buscar y eliminar documento de MongoDB
    const apkDocument = await Apk.findByIdAndDelete(id);

    if (!apkDocument) {
      return NextResponse.json(
        { success: false, error: 'Versión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Versión eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting app version:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la versión' },
      { status: 500 }
    );
  }
}
