# Implementación de Cron Job para Snapshots Diarios en N8n

Este documento detalla los pasos para configurar la automatización de **Snapshots de Inventario** utilizando n8n.

## 📋 Contexto Actual

Aunque el sistema ahora soporta **"Cálculo Inverso"** para reportes históricos inmediatos, mantener snapshots diarios es recomendado para:
- **Redundancia de datos**: Respaldo diario del estado exacto del inventario.
- **Rendimiento**: Análisis de tendencias a largo plazo sin re-calcular movimientos de años.
- **Auditoría**: "Foto" estática inmutable del inventario en un momento dado.

El endpoint para generar snapshots ya está implementado en la API del proyecto:
- **Ruta**: `/api/cron/daily-snapshot`
- **Método**: `POST`
- **Seguridad**: Token Bearer (Custom Header)

---

## 🔐 Paso 1: Configuración de Seguridad en el Servidor

Asegúrate de que tu entorno de producción (Vercel, VPS, etc.) tenga definida la siguiente variable de entorno. Esto protege el endpoint de ejecuciones no autorizadas.

**Archivo `.env.local` o Configuración de Vercel/Hosting:**
```env
CRON_SECRET=tusecreto_super_seguro_v2026
```.
> ⚠️ **Nota:** Cambia el valor por una contraseña fuerte y guárdala. La necesitarás para n8n.

---

## 🤖 Paso 2: Configuración del Workflow en N8n

Sigue estos pasos para crear el cron job en tu instancia de n8n.

### 1. Crear Nuevo Workflow
- Nombre sugerido: **"ServitelV - Daily Inventory Snapshot"**

### 2. Agregar Nodo "Schedule Trigger"
Este nodo iniciará el proceso automáticamente cada día.
- **Trigger Interval**: `Every Day`
- **Hour**: `23`
- **Minute**: `59`
- **Timezone**: `America/Caracas` (GMT-4)

### 3. Agregar Nodo "HTTP Request"
Este nodo llamará a tu API para ejecutar el snapshot.
- **Method**: `POST`
- **URL**: `https://tudominio.com/api/cron/daily-snapshot`
    - *Reemplaza `tudominio.com` con la URL real de tu aplicación web.*
- **Authentication**: `Generic Credential Type` -> `Header Auth` (o simplemente agrega el header manualmente abajo).
- **Headers** (Si lo haces manual):
    - **Name**: `Authorization`
    - **Value**: `tusecreto_super_seguro_v2026` (El valor de tu `CRON_SECRET`)

### 4. (Opcional) Agregar Notificación de Éxito/Fallo
Es buena práctica conectar un nodo de Slack, Telegram o Email después del HTTP Request.
- **On Success**: Enviar mensaje "✅ Snapshot de inventario generado exitosamente. Total items: {{ $json.body.snapshot.totalItems }}".
- **On Error**: Enviar mensaje "❌ Falló el snapshot de inventario. Error: {{ $json.body.error }}".

---

## ✅ Paso 3: Verificación y Pruebas

Antes de confiar en la ejecución automática, realiza una prueba manual:

1. **Prueba desde N8n**:
   - Haz clic en "Execute Node" en el nodo HTTP Request.
   - Verifica que el Output sea `Status: 200` y el JSON incluya `success: true`.

2. **Prueba vía cURL / Postman**:
   ```bash
   curl -X POST https://tudominio.com/api/cron/daily-snapshot \
     -H "Authorization: tusecreto_super_seguro_v2026"
   ```

3. **Verificar en Base de Datos**:
   - Revisa la colección `inventorysnapshots` en MongoDB. Debería aparecer un nuevo documento con la fecha actual.

---

## 🛠️ Solución de Problemas Comunes

| Error | Causa Probable | Solución |
|-------|----------------|----------|
| **401 Unauthorized** | El header `Authorization` no coincide con `CRON_SECRET`. | Verifica que el token sea idéntico en n8n y en las variables de entorno del servidor. |
| **500 Internal Server Error** | Error de conexión a BD o variable no configurada. | Revisa los logs del servidor (Vercel/PM2). Asegura que `MONGODB_URI` y `CRON_SECRET` estén cargados. |
| **Timeouts** | La base de datos es muy grande y el snapshot tarda > 10s. | Aumenta el timeout en el nodo HTTP Request de n8n y en la configuración de la función serverless (si usas Vercel Pro). |
