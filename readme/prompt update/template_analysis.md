# Análisis de Plantillas de Órdenes

## Plantilla 1: INSTALACIÓN

![Orden de Instalación](C:/Users/USUARIO/.gemini/antigravity/brain/2aab0fd7-27e3-4bd9-b7df-f99bbdb51859/uploaded_image_0_1768078776220.jpg)

### Características Identificadas

**Estructura:**
- **Sección:** "Datos del abonado"
- **Sección:** "Servicios a instalar" (con tarjetas visuales)
- **Mensaje WhatsApp:** "368063 #1667990" (número de abonado + ticket)

**Campos Extraídos:**
```
N° Abonado: 368063
Ticket: #1667990 (del mensaje de WhatsApp)
Status del Abonado: Desuscribir (estado del cliente, NO de la orden)
Nombre: DANIEL GEU HERNANDEZ CHACON
Teléfonos: 4247617337, 4247617337
Correo: hernandeztrillosdaniel@gmail.com
Dirección: MUNICIPIO CÁRDENAS, URB. TARIBA...
Nodo: SCRVEG20112A-GPON TAR29A
Status de la Orden: Pendiente

Servicios a instalar:
  - Internet: FibraNet500_500Mb N°20483486, TelefoníaPon 2767400990
  - Streaming: NetUnoGO Plus 3 N°20483487
```

**Indicadores de INSTALACIÓN:**
- ✅ Presencia de sección "Servicios a instalar"
- ✅ Tarjetas visuales con servicios categorizados (Internet, Streaming)
- ✅ Números de servicio (N°20483486, N°20483487)

---

## Plantilla 2: AVERÍA

![Orden de Avería](C:/Users/USUARIO/.gemini/antigravity/brain/2aab0fd7-27e3-4bd9-b7df-f99bbdb51859/uploaded_image_1_1768078776220.jpg)

### Características Identificadas

**Estructura:**
- **Encabezado azul:** "Ticket #1808582"
- **Segunda línea:** "AB 1246068 || FTTH || (SCR) || LOS en rojo"
- **Status:** BAJA (verde), Asignado (gris)
- **Sección:** "Información del Cliente"

**Campos Extraídos:**
```
Ticket: #1808582 (en encabezado azul)
Número de Cliente (AB): 1246068
Tecnología: FTTH
Zona: SCR
Problema: LOS en rojo (Loss of Signal - pérdida de señal)
Status: BAJA, Asignado

Información del Cliente:
  Nombre: SANDIA ALVIAREZ JESUS GERARDO
  Tipo de Documento: Cédula
  Documento: 19359874
  Clase de Cliente: Natural
  Número de Cliente: 1246068
  Segmentación: Natural
  Dirección: Municipio Andrés Bello, Urb. 12 De Octubre Cordero...
  Contacto: SANDIA ALVIAREZ JESUS GERARDO
  Correo: sandiajesus02@gmail.com
  Teléfono: 412-6612301
```

**Indicadores de AVERÍA:**
- ✅ "Ticket #" en encabezado azul
- ✅ Descripción técnica del problema ("LOS en rojo", "FTTH")
- ✅ **NO tiene** sección "Servicios a instalar"
- ✅ Tiene información de documento de identidad y segmentación
- ✅ Status "BAJA" o "Asignado" visible

---

## Diferencias Clave Entre Plantillas

| Campo | Instalación | Avería |
|-------|-------------|--------|
| **Ticket ID** | En mensaje WhatsApp: `#1667990` | En encabezado azul: `Ticket #1808582` |
| **Número de Abonado/Cliente** | `N° Abonado: 368063` | `Número de Cliente: 1246068` o `AB 1246068` |
| **Tipo de Orden** | Tiene sección "Servicios a instalar" | NO tiene "Servicios a instalar" |
| **Descripción Técnica** | Lista de servicios a activar | Problema técnico (ej: "LOS en rojo") |
| **Información Adicional** | - | Documento, Clase de Cliente, Segmentación |
| **Status Visual** | Badge "Pendiente" | Badges "BAJA", "Asignado" en parte superior |

---

## Reglas de Detección Actualizadas

### 1. **Tipo de Orden**

```
SI encuentra "Servicios a instalar" O "servicios a instalar"
  → type = "instalacion"

SI encuentra "Ticket #" en encabezado Y NO encuentra "Servicios a instalar"
  → type = "averia"

SI encuentra palabras: "LOS", "falla", "sin servicio", "problema"
  → type = "averia"

SINO
  → type = "otro"
```

### 2. **Extracción de ticket_id**

**Prioridad 1 - Instalación:**
- Buscar en mensaje de WhatsApp: `368063 #1667990`
- Formato: `#XXXXXXX` (después del número de abonado)

**Prioridad 2 - Avería:**
- Buscar en encabezado azul: `Ticket #1808582`
- Formato: `Ticket #XXXXXXX`

**Formato de extracción:**
- **Instalación:** Extraer el número después del `#` → `"1667990"`
- **Avería:** Extraer el número después de `Ticket #` → `"1808582"`

### 3. **Extracción de subscriberNumber**

**Instalación:**
- Campo: `N° Abonado: 368063`

**Avería:**
- Campo: `Número de Cliente: 1246068`
- O también puede aparecer como: `AB 1246068`

### 4. **Extracción de servicesToInstall**

**Instalación:**
- Buscar sección "Servicios a instalar"
- Extraer todo el texto de las tarjetas
- Ejemplo: `["FibraNet500_500Mb N°20483486", "TelefoníaPon 2767400990", "NetUnoGO Plus 3 N°20483487"]`

**Avería:**
- NO tiene servicios a instalar
- En su lugar, extraer la descripción del problema
- Ejemplo: `["FTTH", "LOS en rojo"]` (tecnología + problema)

---

## Campos Opcionales Según Tipo

### Solo en AVERÍA:
- `subscriberId` (Documento de Identidad)
- Clase de Cliente
- Segmentación
- Descripción técnica del problema

### Solo en INSTALACIÓN:
- Servicios específicos con números de referencia
- Etiquetas (tags)

---

## Ejemplos de JSON Esperados

### Instalación:
```json
{
  "subscriberNumber": "368063",
  "ticket_id": "1667990",
  "type": "instalacion",
  "status": "pending",
  "subscriberName": "DANIEL GEU HERNANDEZ CHACON",
  "address": "MUNICIPIO CÁRDENAS, URB. TARIBA, CALLE PRINCIPAL TARIBA...",
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

### Avería:
```json
{
  "subscriberNumber": "1246068",
  "ticket_id": "1808582",
  "type": "averia",
  "status": "assigned",
  "subscriberName": "SANDIA ALVIAREZ JESUS GERARDO",
  "address": "Municipio Andrés Bello, Urb. 12 De Octubre Cordero, Calle Av Cristobal Mendoza...",
  "phones": ["4126612301"],
  "email": "sandiajesus02@gmail.com",
  "servicesToInstall": ["FTTH", "LOS en rojo"]
}
```

**Nota:** En averías, `servicesToInstall` contiene la descripción del problema, no servicios a instalar.
