# Configuración del Cronjob para Snapshots Diarios

## 📋 Resumen

El sistema de inventario incluye un endpoint que ejecuta snapshots diarios del inventario completo (bodega + cuadrillas). Este endpoint **ya está creado** y listo para usar, solo necesitas configurar cómo se ejecutará automáticamente.

---

## 🔐 Paso 1: Configurar Variable de Entorno

Agrega esta variable a tu archivo `.env.local`:

```env
CRON_SECRET=servitelv_cron_snapshot_2025_abc123xyz
```

> [!IMPORTANT]
> Cambia `servitelv_cron_snapshot_2025_abc123xyz` por un token secreto de tu elección. Guárdalo de forma segura, lo necesitarás para configurar N8n.

---

## 🤖 Paso 2: Configurar Workflow en N8n

### Crear Nuevo Workflow

1. Abre N8n y crea un nuevo workflow
2. Nómbralo: **"Snapshot Diario Inventario Servitelv"**

### Nodo 1: Schedule Trigger

- **Tipo**: Schedule Trigger
- **Configuración**:
  - Trigger Times: `Cron`
  - Cron Expression: `59 23 * * *` (cada día a las 23:59)
  - Timezone: `America/Caracas` (UTC-4)

### Nodo 2: HTTP Request

- **Tipo**: HTTP Request
- **Configuración**:
  - **Method**: `POST`
  - **URL**: `https://tudominio.com/api/cron/daily-snapshot`
    - ⚠️ Reemplaza `tudominio.com` con tu dominio real
  - **Authentication**: None
  - **Headers**:
    ```
    Authorization: servitelv_cron_snapshot_2025_abc123xyz
    Content-Type: application/json
    ```
    - ⚠️ Usa el mismo token que configuraste en `.env.local`

### Nodo 3: IF (Verificación de Éxito)

- **Tipo**: IF
- **Configuración**:
  - Condition: `{{ $json.success }} === true`
  
**Ruta SI (Success)**:
- Conectar a nodo de notificación (WhatsApp/Email):
  - Mensaje: "✅ Snapshot diario creado exitosamente"

**Ruta NO (Error)**:
- Conectar a nodo de alerta (WhatsApp/Email):
  - Mensaje: "❌ Error al crear snapshot: {{ $json.error }}"

---

## ✅ Paso 3: Probar el Endpoint Manualmente

Antes de activar el cron, prueba que el endpoint funciona:

### Usando Thunder Client / Postman:

```
POST https://tudominio.com/api/cron/daily-snapshot

Headers:
Authorization: servitelv_cron_snapshot_2025_abc123xyz
Content-Type: application/json
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Snapshot diario creado correctamente",
  "snapshot": {
    "id": "...",
    "date": "2025-12-15T23:59:59.000Z",
    "totalItems": 25,
    "totalWarehouseStock": 5430,
    "crewsTracked": 8
  }
}
```

---

## 🔍 Verificar que Está Funcionando

### 1. En N8n:
- Activa el workflow
- Espera a las 23:59 o prueba manualmente con "Execute Workflow"
- Verifica que recibes la notificación de éxito

### 2. En tu Base de Datos:
```javascript
// Consultar los últimos snapshots
db.inventorysnapshots.find().sort({ snapshotDate: -1 }).limit(5)
```

### 3. Desde tu API:
```
GET https://tudominio.com/api/web/inventory/snapshots
```

---

## 🆘 Solución de Problemas

### Error 401 "No autorizado"
- Verifica que el header `Authorization` en N8n coincida exactamente con `CRON_SECRET` en `.env.local`
- Reinicia el servidor después de cambiar `.env.local`

### Error 500 "Configuración de servidor incorrecta"
- `CRON_SECRET` no está configurado en `.env.local`
- Asegúrate de reiniciar el servidor Next.js

### El snapshot se crea vacío
- Verifica que tienes ítems de inventario creados
- Verifica que las cuadrillas tienen inventario asignado

---

## 📊 Ver Estadísticas de Uso

Una vez tengas al menos 2 snapshots, puedes obtener estadísticas:

```
GET https://tudominio.com/api/web/inventory/statistics?startDate=2025-12-01&endDate=2025-12-15
```

Esto te devolverá:
- Total de materiales consumidos por ítem
- Movimientos agrupados por tipo
- Comparación entre estados de inventario
