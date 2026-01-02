import PocketBase from 'pocketbase';

// Conectar a PocketBase usando la variable de entorno
const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');

export default pb;