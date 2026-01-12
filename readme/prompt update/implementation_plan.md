# Plan de Implementación Actualizado: Soporte para Plantillas Específicas

## Objetivo

Actualizar el endpoint `/api/agent/getOrders` para manejar correctamente las DOS plantillas de órdenes: **INSTALACIÓN** y **AVERÍA**.

---

## Cambios Necesarios en el Backend

### Archivo: [route.ts](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts)

---

## 1. Actualizar Función [deduceType](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#82-94) (Líneas 82-93)

### Problema Actual
La función solo busca palabras clave genéricas, pero no considera las características específicas de las plantillas.

### Solución Actualizada

```typescript
const deduceType = (
  explicit: any,
  services: string[],
  textFields: string[],
  hasNode: boolean  // ← NUEVO parámetro
) => {
  // Si viene explícito, usar ese valor
  if (explicit && typeof explicit === "string") {
    const normalized = explicit.toLowerCase();
    if (normalized === "instalacion" || normalized === "instalación") return "instalacion";
    if (normalized === "averia" || normalized === "avería") return "averia";
    if (normalized === "otro") return "otro";
  }

  const joined = [...services, ...textFields].join(" ").toLowerCase();
  
  // REGLA 1: Si tiene "servicios a instalar" en los servicios → instalación
  const servicesText = services.join(" ").toLowerCase();
  if (
    servicesText.includes("fibranet") ||
    servicesText.includes("streaming") ||
    servicesText.includes("n°") ||  // Números de referencia de servicios
    servicesText.includes("telefoniapon")
  ) {
    return "instalacion";
  }
  
  // REGLA 2: Si menciona problemas técnicos → avería
  if (
    /ftth|los|loss of signal|sin señal|no funciona|baja|caido|intermitente/i.test(joined)
  ) {
    return "averia";
  }
  
  // REGLA 3: Palabras clave tradicionales
  if (/instal|instalaci|instalar|activaci|conexi.*nueva/.test(joined)) {
    return "instalacion";
  }
  
  if (/averi|fallo|falla|repar|reparaci|problema|daño/.test(joined)) {
    return "averia";
  }
  
  return "otro";
};
```

---

## 2. Agregar Normalización de `ticket_id` (Después de línea 118)

### Problema
El ticket_id puede venir con formatos diferentes:
- `"#1667990"` (instalación)
- `"1808582"` (ya limpio)
- `"Ticket #1808582"` (con prefijo)

### Solución

```typescript
// Línea ~119: Extraer y limpiar ticket_id
let ticket_id = data.ticket_id || data.ticketId || data.ticket || null;

// Limpiar el ticket_id: remover "#", "Ticket", espacios
if (ticket_id) {
  ticket_id = String(ticket_id)
    .replace(/^Ticket\s*#?/i, '')  // Remover "Ticket #" o "Ticket#"
    .replace(/^#/, '')              // Remover "#" al inicio
    .trim();                        // Remover espacios
  
  // Si después de limpiar queda vacío, poner null
  if (!ticket_id) {
    ticket_id = null;
  }
}

console.log("📋 Ticket ID extraído y limpiado:", ticket_id);
```

**Ejemplos de limpieza:**
- `"#1667990"` → `"1667990"` ✅
- `"Ticket #1808582"` → `"1808582"` ✅
- `"1808582"` → `"1808582"` ✅
- `"#"` → `null` ✅

---

## 3. Normalizar `subscriberNumber` (Actualizar líneas 59-69)

### Problema
El número de abonado puede venir como:
- `"368063"` (instalación)
- `"AB 1246068"` (avería)
- En el mensaje de WhatsApp: `"368063 #1667990"` (primer número)

### Solución

```typescript
// Línea ~59: Extraer subscriberNumber con múltiples fallbacks
let subscriberNumber =
  data.subscriberNumber ||
  data.subscriber_number ||
  data.NAbonado ||
  data.numeroCliente ||
  data.AB ||
  data.subscriber?.number;

// Si no se encontró, intentar extraer del mensaje de WhatsApp
if (!subscriberNumber && data.whatsappMessage) {
  // Formato esperado: "368063 #1667990"
  const match = data.whatsappMessage.match(/^(\d+)\s*#/);
  if (match) {
    subscriberNumber = match[1];
  }
}

// Limpiar: remover "AB", espacios, guiones
if (subscriberNumber) {
  subscriberNumber = String(subscriberNumber)
    .replace(/^AB\s*/i, '')  // Remover "AB " al inicio
    .replace(/[\s\-]/g, '')  // Remover espacios y guiones
    .trim();
}

if (!subscriberNumber) {
  return NextResponse.json(
    { error: "subscriberNumber (N. Abonado) is required" },
    { status: 400, headers: CORS_HEADERS }
  );
}

console.log("👤 Subscriber Number limpiado:", subscriberNumber);
```

**Ejemplos de limpieza:**
- `"368063"` → `"368063"` ✅
- `"AB 1246068"` → `"1246068"` ✅
- `"1246068"` → `"1246068"` ✅

---

## 4. Actualizar [mapStatus](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#95-106) para Nuevos Valores (Líneas 95-105)

### Problema
Las plantillas tienen status específicos:
- Instalación: "Pendiente"
- Avería: "BAJA", "Asignado"

### Solución

```typescript
const mapStatus = (s: any) => {
  if (!s) return "pending";
  const str = String(s).toLowerCase().trim();
  
  // Mapeos específicos de las plantillas
  if (/pendiente|pending|baja/i.test(str)) return "pending";
  if (/asignado|assigned/i.test(str)) return "assigned";
  if (/en[_ ]?progreso|in_progress|in progress/i.test(str)) return "in_progress";
  if (/completado|completed/i.test(str)) return "completed";
  if (/cancelado|cancelled/i.test(str)) return "cancelled";
  
  // Si no coincide con ninguno, devolver pending por defecto
  console.warn("⚠️ Status no reconocido:", s, "→ usando 'pending'");
  return "pending";
};
```

**Mapeos nuevos:**
- `"BAJA"` → `"pending"` ✅ (orden recién creada)

---

## 5. Agregar Extracción de Coordenadas (Línea ~120)

```typescript
// Línea ~120: Extraer y validar coordenadas (OPCIONAL)
let coordinates = undefined;

if (data.coordinates) {
  const lat = data.coordinates.latitude || data.coordinates.lat;
  const lng = data.coordinates.longitude || data.coordinates.lng || data.coordinates.lon;
  
  if (lat !== undefined && lng !== undefined) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Validar rangos válidos para coordenadas
    if (
      !isNaN(latitude) && 
      !isNaN(longitude) &&
      latitude >= -90 && 
      latitude <= 90 &&
      longitude >= -180 && 
      longitude <= 180
    ) {
      coordinates = { latitude, longitude };
      console.log("📍 Coordenadas validadas:", coordinates);
    } else {
      console.warn('⚠️ Coordenadas fuera de rango:', { latitude, longitude });
    }
  }
}

// NOTA: Las plantillas actuales NO tienen coordenadas explícitas
// Solo tienen un botón "Mapa" que no muestra lat/lng
// Este código está preparado para futuras versiones que sí las incluyan
```

---

## 6. Actualizar Llamada a [deduceType](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#82-94) (Línea ~120)

```typescript
const type = deduceType(
  data.type,
  servicesToInstall,
  [data.title, data.subject, data.description, data.body].filter(Boolean),
  !!node  // ← NUEVO: pasar si tiene nodo
);
```

---

## 7. Actualizar Objeto `update` (Líneas ~129-139)

```typescript
const update = {
  subscriberNumber: String(subscriberNumber),
  ticket_id,          // ✅ NUEVO: ya limpio (sin # ni "Ticket")
  type,               // ✅ Mejorado: detección más precisa
  status,             // ✅ Mejorado: mapea "BAJA" correctamente
  subscriberName,
  address,
  phones,
  email,
  node,
  servicesToInstall,
  coordinates,        // ✅ NUEVO: opcional
} as Record<string, any>;

// Logging mejorado
console.log("📦 Datos procesados para guardar:", {
  subscriberNumber,
  ticket_id: ticket_id || "❌ NO ENCONTRADO",
  type,
  status,
  coordinates: coordinates ? "✅ Sí" : "❌ No"
});
```

---

## 8. Advertencia si Falta `ticket_id` (Después del update)

```typescript
// Advertencia si no hay ticket_id (debería ser RARO)
if (!ticket_id) {
  console.warn('⚠️⚠️⚠️ ADVERTENCIA: Orden sin ticket_id!');
  console.warn('Datos recibidos:', JSON.stringify(data, null, 2));
  
  // OPCIONAL: Si quieres hacer el ticket_id obligatorio:
  // return NextResponse.json(
  //   { error: "ticket_id is required but not found in the image" },
  //   { status: 400, headers: CORS_HEADERS }
  // );
}
```

---

## Testing con las Plantillas Reales

### Test 1: Orden de Instalación

**Entrada esperada del AI:**
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
  ]
}
```

**Procesamiento esperado:**
- ✅ `subscriberNumber`: "368063" (limpio)
- ✅ `ticket_id`: "1667990" (sin el #)
- ✅ `type`: "instalacion" (detectado por servicios con N°)
- ✅ `status`: "pending" (mapeado de "Pendiente")

### Test 2: Orden de Avería

**Entrada esperada del AI:**
```json
{
  "subscriberNumber": "1246068",
  "ticket_id": "1808582",
  "type": "averia",
  "status": "assigned",
  "subscriberName": "SANDIA ALVIAREZ JESUS GERARDO",
  "address": "Municipio Andrés Bello...",
  "phones": ["4126612301"],
  "email": "sandiajesus02@gmail.com",
  "node": null,
  "servicesToInstall": ["FTTH", "LOS en rojo"]
}
```

**Procesamiento esperado:**
- ✅ `subscriberNumber`: "1246068" (limpio, sin "AB")
- ✅ `ticket_id`: "1808582" (sin "Ticket #")
- ✅ `type`: "averia" (detectado por "FTTH", "LOS")
- ✅ `status`: "assigned" (mapeado de "Asignado")
- ✅ `servicesToInstall`: ["FTTH", "LOS en rojo"] (descripción del problema)

---

## Código Completo Actualizado

### Sección de Extracción (Líneas ~59-155)

```typescript
// ============================================
// 1. EXTRAER Y LIMPIAR SUBSCRIBER NUMBER
// ============================================
let subscriberNumber =
  data.subscriberNumber ||
  data.subscriber_number ||
  data.NAbonado ||
  data.numeroCliente ||
  data.AB ||
  data.subscriber?.number;

// Intentar extraer del mensaje de WhatsApp si no se encontró
if (!subscriberNumber && data.whatsappMessage) {
  const match = data.whatsappMessage.match(/^(\d+)\s*#/);
  if (match) {
    subscriberNumber = match[1];
  }
}

// Limpiar
if (subscriberNumber) {
  subscriberNumber = String(subscriberNumber)
    .replace(/^AB\s*/i, '')
    .replace(/[\s\-]/g, '')
    .trim();
}

if (!subscriberNumber) {
  return NextResponse.json(
    { error: "subscriberNumber (N. Abonado) is required" },
    { status: 400, headers: CORS_HEADERS }
  );
}

console.log("👤 Subscriber Number limpiado:", subscriberNumber);

// ============================================
// 2. EXTRAER OTROS CAMPOS
// ============================================
const subscriberName =
  data.subscriberName || data.subscriber?.name || data.nombre || "";
const address = data.address || data.direccion || data.address_full || "";
const phones = splitToArray(
  data.phones || data.telefonos || data.phone || data.telefono
);
const email = data.email || data.correo || "";
const node = data.node || data.nodo || "";
const servicesToInstall = splitToArray(
  data.servicesToInstall || data.services || data.servicios
);

// ============================================
// 3. EXTRAER Y LIMPIAR TICKET_ID
// ============================================
let ticket_id = data.ticket_id || data.ticketId || data.ticket || null;

if (ticket_id) {
  ticket_id = String(ticket_id)
    .replace(/^Ticket\s*#?/i, '')
    .replace(/^#/, '')
    .trim();
  
  if (!ticket_id) {
    ticket_id = null;
  }
}

console.log("📋 Ticket ID extraído y limpiado:", ticket_id);

// Advertencia si falta (raro)
if (!ticket_id) {
  console.warn('⚠️⚠️⚠️ ADVERTENCIA: Orden sin ticket_id!');
}

// ============================================
// 4. EXTRAER Y VALIDAR COORDENADAS (OPCIONAL)
// ============================================
let coordinates = undefined;

if (data.coordinates) {
  const lat = data.coordinates.latitude || data.coordinates.lat;
  const lng = data.coordinates.longitude || data.coordinates.lng || data.coordinates.lon;
  
  if (lat !== undefined && lng !== undefined) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (
      !isNaN(latitude) && 
      !isNaN(longitude) &&
      latitude >= -90 && 
      latitude <= 90 &&
      longitude >= -180 && 
      longitude <= 180
    ) {
      coordinates = { latitude, longitude };
      console.log("📍 Coordenadas validadas:", coordinates);
    } else {
      console.warn('⚠️ Coordenadas fuera de rango:', { latitude, longitude });
    }
  }
}

// ============================================
// 5. DEDUCIR TIPO Y STATUS
// ============================================
const type = deduceType(
  data.type,
  servicesToInstall,
  [data.title, data.subject, data.description, data.body].filter(Boolean),
  !!node
);

const status = mapStatus(
  data.status || data.orderStatus || data.estado || "pending"
);

// ============================================
// 6. PREPARAR OBJETO PARA GUARDAR
// ============================================
const update = {
  subscriberNumber: String(subscriberNumber),
  ticket_id,
  type,
  status,
  subscriberName,
  address,
  phones,
  email,
  node,
  servicesToInstall,
  coordinates,
} as Record<string, any>;

console.log("📦 Datos procesados para guardar:", {
  subscriberNumber,
  ticket_id: ticket_id || "❌ NO ENCONTRADO",
  type,
  status,
  hasCoordinates: !!coordinates
});
```

---

## Resumen de Cambios

| Cambio | Líneas | Complejidad |
|--------|--------|-------------|
| Actualizar [deduceType](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#82-94) con reglas específicas | ~82-115 | Media |
| Limpiar `ticket_id` (remover # y "Ticket") | ~119-135 | Baja |
| Normalizar `subscriberNumber` (remover "AB") | ~59-95 | Media |
| Actualizar [mapStatus](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#95-106) (incluir "BAJA") | ~95-110 | Baja |
| Agregar extracción de `coordinates` | ~136-155 | Media |
| Actualizar objeto `update` | ~157-168 | Baja |
| Agregar logging mejorado | Múltiples | Baja |

**Total:** ~80 líneas de código nuevo/modificado

---

## Próximos Pasos

1. ✅ Implementar cambios en [route.ts](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/web/orders/route.ts)
2. ✅ Probar con las 2 imágenes reales usando Postman/curl
3. ✅ Actualizar el prompt en n8n
4. ✅ Monitorear logs durante 1 semana:
   - ¿Se extrae siempre el `ticket_id`?
   - ¿El tipo se detecta correctamente?
   - ¿Hay órdenes que caen en "otro"?
5. 📊 Ajustar palabras clave de [deduceType](file:///c:/Users/USUARIO/Desktop/proyectos/servitelv/web/app/api/agent/getOrders/route.ts#82-94) según resultados reales
