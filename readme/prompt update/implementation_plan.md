# Plan de Implementación: Prompt Optimizado para n8n + Gemini

## Objetivo

Documentar el nuevo prompt optimizado para n8n y asegurar que el backend en `/api/agent/getOrders` procese correctamente todos los campos, incluyendo el nuevo campo `crewNumber`.

---

## 🎯 Nuevo Prompt (Optimizado)

Este es el prompt que se usa en el nodo **"Analyze an image"** de n8n:

```javascript
={{ 
`Eres un asistente de IA especializado en Servitel para escanear órdenes de servicio.

### REGLAS DE IDENTIFICACIÓN (Visual)
1. INSTALACIÓN: Sección "Servicios a instalar" con tarjetas visuales de servicios.
2. AVERÍA: Encabezado azul con "Ticket #XXXXXXX", tecnología "FTTH" y status "BAJA" o "Asignado".

### REGLAS DE EXTRACCIÓN Y LIMPIEZA (IDs)
- ticket_id: Extraer SOLO el número. Eliminar prefijos "Ticket" o "#".
- subscriberNumber: Extraer solo el número. Eliminar prefijos "AB" o "N° Abonado".
- servicesToInstall: En averías, extrae la descripción técnica del problema si existen, si no devuelvelo como null.

### CONTEXTO DINÁMICO (WhatsApp Caption)
"${$node["When Executed by Another Workflow"].json.messages[0].image.caption || "Sin texto adicional"}"

### PRIORIDAD Y DATOS EXTRA
- Si en el texto de WhatsApp ves "cuadrilla:#XXXX", añade "crewNumber": "XXXX" al JSON y "status":"Pendiente".
- Si ves "368063 #1667990", el primer número es subscriberNumber y el segundo ticket_id. Estos datos TIENEN PRIORIDAD sobre la imagen.

IMPORTANTE: Devuelve ÚNICAMENTE un JSON válido, sin markdown ni explicaciones.

FORMATO:
{
  "subscriberNumber": "...",
  "ticket_id": "...",
  "type": "instalacion | averia | otro",
  "status": "pending | assigned",
  "subscriberName": "...",
  "address": "...",
  "phones": [],
  "email": "...",
  "node": "...",
  "servicesToInstall": [],
  "crewNumber": null
}`
}}
```

---

## 📦 Estructura del JSON Esperado

### Ejemplo 1: Instalación con Caption
**WhatsApp Caption:** `"368063 #1667990"`

```json
{
  "subscriberNumber": "368063",
  "ticket_id": "1667990",
  "type": "instalacion",
  "status": "pending",
  "subscriberName": "DANIEL GEU HERNANDEZ CHACON",
  "address": "MUNICIPIO CÁRDENAS, URB. TARIBA...",
  "phones": ["4247617337"],
  "email": "hernandeztrillosdaniel@gmail.com",
  "node": "SCRVEG20112A-GPON TAR29A",
  "servicesToInstall": [
    "FibraNet500_500Mb N°20483486",
    "TelefoníaPon 2767400990",
    "NetUnoGO Plus 3 N°20483487"
  ],
  "crewNumber": null
}
```

### Ejemplo 2: Avería con Cuadrilla
**WhatsApp Caption:** `"cuadrilla:5"`

```json
{
  "subscriberNumber": "1246068",
  "ticket_id": "1808582",
  "type": "averia",
  "status": "pending",
  "subscriberName": "SANDIA ALVIAREZ JESUS GERARDO",
  "address": "Municipio Andrés Bello, Urb. 12 De Octubre Cordero...",
  "phones": ["4126612301"],
  "email": "sandiajesus02@gmail.com",
  "node": null,
  "servicesToInstall": ["FTTH", "LOS en rojo"],
  "crewNumber": "5"
}
```

---

## ✅ Campos Procesados por el Backend

El archivo [route.ts](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts) ahora procesa:

| Campo              | Fuente                                    | Procesamiento                                      |
| ------------------ | ----------------------------------------- | -------------------------------------------------- |
| `subscriberNumber` | JSON o WhatsApp caption                   | Limpiado (sin "AB", sin "N° Abonado")             |
| `ticket_id`        | JSON o WhatsApp caption                   | Limpiado (sin "#", sin "Ticket")                  |
| `type`             | JSON (explícito) o deducido               | Normalizado: `instalacion`, `averia`, `otro`      |
| `status`           | JSON                                      | Normalizado: `pending`, `assigned`, etc.          |
| `subscriberName`   | JSON                                      | String                                            |
| `address`          | JSON                                      | String                                            |
| `phones`           | JSON                                      | Array de strings                                  |
| `email`            | JSON                                      | String                                            |
| `node`             | JSON                                      | String o null                                     |
| `servicesToInstall`| JSON                                      | Array de strings (servicios o descripción avería) |
| **`crewNumber`**   | **JSON (desde WhatsApp caption)** ✅ NUEVO | String o null (número de cuadrilla)              |

---

## 🔄 Flujo de Datos Completo

### Paso 1: Usuario envía imagen por WhatsApp
- **Con caption:** `"368063 #1667990"` (instalación) o `"cuadrilla:5"` (avería)
- **Sin caption:** Solo la imagen

### Paso 2: n8n procesa el mensaje
1. **Switch1** detecta `type: "image"`
2. **HTTP Request** obtiene metadata de la imagen
3. **HTTP Request1** descarga la imagen como binario

### Paso 3: Gemini analiza la imagen + caption
**Input al nodo "Analyze an image":**
- `binaryPropertyName: "data"` (la imagen)
- `text: [PROMPT CON CAPTION INYECTADO]`

**Output esperado:**
```json
{
  "content": {
    "parts": [
      {
        "text": "{\"subscriberNumber\":\"368063\",...}"
      }
    ]
  }
}
```

### Paso 4: Backend procesa el JSON
**Endpoint:** `POST /api/agent/getOrders`

**Procesamiento:**
```typescript
// 1. Extraer crewNumber (NUEVO)
const crewNumber = data.crewNumber || null;
if (crewNumber) {
  console.log("👷 Crew Number detectado:", crewNumber);
}

// 2. Normalizar type y status (YA EXISTENTE - MEJORADO)
const type = deduceType(data.type, servicesToInstall, textFields);
const status = mapStatus(data.status || "pending");

// 3. Crear objeto para guardar
const update = {
  subscriberNumber,
  ticket_id,
  type,
  status,
  subscriberName,
  address,
  phones,
  email,
  node,
  servicesToInstall,
  crewNumber, // ✅ NUEVO
};
```

### Paso 5: Guardar en MongoDB
- **Si es instalación + dirección existe:** 302 (ya existe)
- **Si datos duplicados en última semana:** 302 (ya existe)
- **Si es nuevo:** 200 (guardado exitoso)

---

## 🧪 Casos de Prueba

### Test 1: Instalación con Caption
**Input WhatsApp:**
- Imagen: Plantilla de instalación
- Caption: `"368063 #1667990"`

**JSON esperado de Gemini:**
```json
{
  "subscriberNumber": "368063",
  "ticket_id": "1667990",
  "type": "instalacion",
  "status": "pending",
  "crewNumber": null
}
```

**Procesamiento backend:**
- ✅ `subscriberNumber`: `"368063"` (del caption tiene prioridad)
- ✅ `ticket_id`: `"1667990"` (del caption tiene prioridad)
- ✅ `type`: `"instalacion"` (normalizado)
- ✅ `status`: `"pending"` (normalizado)
- ✅ `crewNumber`: `null` (no hay cuadrilla)

---

### Test 2: Avería con Cuadrilla
**Input WhatsApp:**
- Imagen: Plantilla de avería
- Caption: `"cuadrilla:5"`

**JSON esperado de Gemini:**
```json
{
  "subscriberNumber": "1246068",
  "ticket_id": "1808582",
  "type": "averia",
  "status": "pending",
  "crewNumber": "5"
}
```

**Procesamiento backend:**
- ✅ `subscriberNumber`: `"1246068"` (de la imagen)
- ✅ `ticket_id`: `"1808582"` (de la imagen)
- ✅ `type`: `"averia"` (normalizado)
- ✅ `status`: `"pending"` (normalizado desde "BAJA")
- ✅ `crewNumber`: `"5"` (del caption) 👷

---

### Test 3: JSON en Inglés (Multilingüe)
**Input JSON:**
```json
{
  "subscriberNumber": "1364467",
  "type": "Installation",
  "status": "Pending"
}
```

**Procesamiento backend:**
- ✅ `type`: `"Installation"` → normalizado a `"instalacion"`
- ✅ `status`: `"Pending"` → normalizado a `"pending"`

---

## 📊 Mejoras Implementadas

| Mejora                     | Antes                         | Ahora                                              |
| -------------------------- | ----------------------------- | -------------------------------------------------- |
| **Soporte multilingüe**    | Solo español                  | Español e inglés (case-insensitive)                |
| **Campo crewNumber**       | ❌ No existía                 | ✅ Soportado desde WhatsApp caption                |
| **Prioridad de datos**     | Solo de la imagen             | Caption de WhatsApp tiene prioridad                |
| **Detección de tipo**      | Reglas básicas                | Reglas mejoradas + detección visual                |
| **Logging**                | Básico                        | Detallado con emojis y warnings                    |
| **Status fallback**        | Devolvía el string original   | Usa `"pending"` por defecto + warning en logs      |

---

## 🚀 Próximos Pasos

1. ✅ **Backend actualizado** con soporte para `crewNumber`
2. ✅ **Prompt optimizado** con reglas claras y concisas
3. 🔄 **Probar en n8n** con imágenes reales y diferentes captions
4. 📊 **Monitorear logs** para verificar que:
   - `crewNumber` se detecta correctamente
   - Caption de WhatsApp tiene prioridad sobre la imagen
   - Status y type se normalizan correctamente

---

## ⚠️ Notas Importantes

1. **Caption tiene prioridad**: Si el caption contiene `"368063 #1667990"`, esos datos sobrescribirán lo que se detecte en la imagen

2. **crewNumber es opcional**: Solo se usa cuando el caption contiene `"cuadrilla:#XXXX"`

3. **servicesToInstall en averías**: Puede ser `null` si no hay descripción técnica del problema

4. **Multilingüe**: El backend ahora acepta tanto español como inglés para `type` y `status`

5. **Compatibilidad**: Todos los JSONs antiguos siguen funcionando sin cambios
