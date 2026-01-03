import PocketBase from 'pocketbase';

// Conectar a PocketBase usando la variable de entorno
const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');

// Cache de autenticación para evitar autenticarse en cada petición
let authPromise: Promise<void> | null = null;
let lastAuthTime = 0;
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function ensureAuth() {
  const now = Date.now();
  
  // Si ya estamos autenticados y el token no ha expirado, reutilizar
  if (pb.authStore.isValid && (now - lastAuthTime) < AUTH_CACHE_DURATION) {
    return;
  }
  
  // Si ya hay una autenticación en progreso, esperar a que termine
  if (authPromise) {
    return authPromise;
  }
  
  // Iniciar nueva autenticación
  authPromise = (async () => {
    try {
      await pb.collection("_superusers").authWithPassword(
        process.env.PB_ADMIN_EMAIL!,
        process.env.PB_ADMIN_PASS!
      );
      lastAuthTime = Date.now();
    } finally {
      authPromise = null;
    }
  })();
  
  return authPromise;
}

export default pb;