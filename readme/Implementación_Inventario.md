# 📦 Plan de Implementación: Módulo de Gestión de Inventario (Servitelv SGO)

## 1. Visión General

El objetivo es implementar un sistema de inventario dinámico y trazable que gestione el ciclo de vida completo de los materiales: desde la entrada (proveedor Netuno) hasta su consumo final en una instalación o avería, integrando Inteligencia Artificial para la carga de datos.

### Flujo de Datos

```
Netuno (Guía de Despacho) → N8n (IA) → Bodega Central → Asignación Web → Inventario Cuadrilla → App Móvil (Cierre) → Consumo/Historial
```

---

## 2. Estrategia de Arquitectura

### A. Definición de Ítems (Catálogo)

- **Decisión**: Mantener el catálogo en Base de Datos (`InventoryModel`).
- **Justificación**: Permite escalabilidad (nuevos materiales sin tocar código), validación de datos, y evita errores de tipeo entre el Agente IA y el sistema.
- **Gestión**: Se podrán crear/editar/eliminar ítems desde el Panel Web Administrativo.

### B. Lógica de Movimientos (Backend)

No se manipularán los stocks directamente mediante CRUD simples. Se crearán **Servicios de Transacción** que aseguren la integridad de los datos:

#### Reabastecimiento (Restock):
- **Entrada**: Lista de ítems y cantidades + Motivo (ej: "Nota de Entrega #123").
- **Acción**: `Inventory.currentStock` (+) y `InventoryHistory` (type: 'entry').
- **Origen**: Panel Web (Manual) o N8n (Automático vía IA).

#### Asignación a Cuadrilla (Assignment):
- **Entrada**: ID del Instalador + Lista de ítems.
- **Acción**: `Inventory.currentStock` (-) y `Installer.assignedInventory` (+).
- **Validación**: No permitir asignar si no hay stock en bodega.
- **Registro**: `InventoryHistory` (type: 'assignment').

#### Consumo en Orden (Usage):
- **Entrada**: ID de Orden + Materiales usados.
- **Acción**: `Installer.assignedInventory` (-).
- **Registro**: `InventoryHistory` (type: 'usage_order').

### C. Estrategia de IA (N8n)

- **Trigger**: Recepción de imagen (WhatsApp/Drive).
- **Procesamiento**: OpenAI (GPT-4o) extrae JSON: `[{ "nombre": "Cable UTP", "cantidad": 300 }]`.
- **Fuzzy Matching**: La API o N8n deberá emparejar el nombre extraído con el `InventoryModel` existente para obtener el `_id` correcto.
- **Carga**: N8n enviará el POST al endpoint de Reabastecimiento.

---

## 3. Hoja de Ruta de Desarrollo (Paso a Paso)

### Fase 1: Backend Core 

- Actualizar modelos (`Installer` y `InventoryHistory`) para soportar la estructura de datos requerida.
- Desarrollar `lib/inventoryService.ts` con la lógica transaccional (restock, assign, consume).
- Crear Endpoints API especializados:
  - `POST /api/web/inventory/movements/restock`
  - `POST /api/web/inventory/movements/assign`

### Fase 2: Frontend Web 

- **Vista de Inventario Central**: Tabla con stock actual y botón de "Ingreso Manual".
- **Vista de Asignación**: Formulario para seleccionar un Técnico y usar un Autocomplete múltiple para añadir materiales a su carga.
- **Vista de Instaladores**: Ver el inventario actual que tiene cada cuadrilla en su poder (lectura del subdocumento `assignedInventory`).

### Fase 3: Integración Móvil y Cierre 

- Conectar el cierre de la orden en la App Móvil con el endpoint de consumo.
- Asegurar que al cerrar la orden, se descuente del inventario personal de la cuadrilla.

### Fase 4: Historial y Reportes

- Implementar tarea programada (Cron Job) para el "Snapshot Diario" a las 23:59 (guardar foto del estado del inventario para reportes históricos rápidos).

---

## 4. Estructura de Endpoints Propuesta

| Método | Ruta | Descripción | Payload Esperado |
|--------|------|-------------|------------------|
| POST | `/api/web/inventory/movements/restock` | Ingreso a Bodega (N8n/Web) | `{ items: [{id, qty}], reason: string }` |
| POST | `/api/web/inventory/movements/assign` | De Bodega a Técnico | `{ installerId: string, items: [{id, qty}] }` |
| POST | `/api/web/orders/complete` | Cierre de orden + Consumo | `{ orderId, status: 'completed', materialsUsed: [...] }` |

Actúa como un Desarrollador Senior Backend experto en Next.js 14 (App Router), Mongoose y TypeScript.
Estamos desarrollando el módulo de Inventario para el sistema "Servitelv".
Necesito que generes la lógica de servicio y los endpoints de la API para manejar el flujo de materiales.

Contexto de Modelos (Asume que ya existen):
- InventoryModel (Colección: inventories): Tiene `currentStock` (number).
- InstallerModel (Colección: installers): Tiene un array `assignedInventory: [{ item: ObjectId, quantity: number, lastUpdate: Date }]`.
- InventoryHistoryModel (Colección: inventoryhistories): Registra movimientos con `type`, `quantityChange`, `reason`, `installer`, `order`.

Requerimientos Técnicos:

1. Actualiza/Crea el archivo `lib/inventoryService.ts`. Debe exportar funciones asíncronas robustas para:
   - `restockInventory(items: {inventoryId: string, quantity: number}[], reason: string)`:
     - Itera sobre los items.
     - Usa `$inc` para sumar al `currentStock` del InventoryModel.
     - Crea un registro en InventoryHistoryModel con `type: 'entry'`.
   
   - `assignMaterialToInstaller(installerId: string, items: {inventoryId: string, quantity: number}[], userId: string)`:
     - Verifica primero si hay suficiente stock en InventoryModel. Si no, lanza error.
     - Resta del InventoryModel (`$inc: -quantity`).
     - Realiza un "upsert" en el array `assignedInventory` del InstallerModel: Si el ítem ya existe, suma la cantidad; si no, haz `$push`.
     - Crea registro en InventoryHistoryModel con `type: 'assignment'`.

   - `processOrderUsage(orderId: string, installerId: string, materials: {inventoryId: string, quantity: number}[])`:
     - Resta la cantidad del `assignedInventory` del InstallerModel.
     - Crea registro en InventoryHistoryModel con `type: 'usage_order'`.

2. Crea los Endpoints (Route Handlers) en la carpeta `app/api/web/inventory/movements/`:
   - `route.ts` (POST): Que actúe como despachador. Debe recibir un body con `{ action: 'restock' | 'assign', data: ... }`.
   - Dependiendo de la acción, llama a la función del servicio correspondiente.
   - Maneja errores con `NextResponse` (status 400 para falta de stock, 500 para errores de servidor).

3. Reglas:
   - Usa `mongoose.startSession()` si es posible para transacciones, o asegúrate de que la lógica sea segura.
   - Tipado estricto con TypeScript.
   - Código limpio y comentado en español.