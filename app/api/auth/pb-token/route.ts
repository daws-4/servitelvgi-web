import { NextResponse } from 'next/server';
import pb, { ensureAuth } from '@/lib/pocketBase';

/**
 * GET /api/auth/pb-token
 * Retorna los datos de autenticación de PocketBase para usar desde el cliente
 */
export async function GET() {
  try {
    await ensureAuth();
    
    // Retornar el token Y el modelo completo de autenticación
    const token = pb.authStore.token;
    const model = pb.authStore.model;
    
    if (!token || !model) {
      return NextResponse.json(
        { error: 'No se pudo autenticar con PocketBase' },
        { status: 401 }
      );
    }

    // Retornar los datos completos de autenticación
    return NextResponse.json({ 
      token,
      model 
    });
  } catch (error) {
    console.error('Error getting PocketBase auth:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de autenticación' },
      { status: 500 }
    );
  }
}
