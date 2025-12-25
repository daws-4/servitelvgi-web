# Sistema de Gestión de Operaciones (SGO) - Servitel

Sistema integral de gestión para operaciones de Servitel, contratista de Netuno. Digitaliza y automatiza el ciclo completo de órdenes de servicio (instalaciones y averías), gestión de cuadrillas, control de inventario, y generación de reportes empresariales.

---

## 🚀 Stack Tecnológico

### Frontend
* **Framework:** Next.js 16 + React 18 + TypeScript
* **UI Library:** HeroUI (Componentes modernos basados en React Aria)
* **Estilos:** Tailwind CSS 4.1
* **Animaciones:** Framer Motion
* **Estado:** React Context API
* **Manejo de Fechas:** date-fns 4.1

### Backend
* **Runtime:** Node.js
* **Framework:** Next.js API Routes (Serverless)
* **Base de Datos:** MongoDB 8.19 + Mongoose
* **Autenticación:** JWT (JSON Web Tokens) con Jose
* **Hash de Contraseñas:** bcryptjs

### Integración y Automatización
* **Workflow Engine:** n8n
* **IA:** OpenAI GPT-4o (procesamiento de imágenes)
* **Mensajería:** WhatsApp Business API (Meta)
* **Reportes Externos:** Google Forms (Netuno)

### Exportación de Reportes
* **Excel:** xlsx, xlsx-js-style
* **PDF:** jsPDF + jspdf-autotable
* **Word:** docx
* **Guardado:** file-saver

---

## 📦 Arquitectura del Sistema

El sistema está compuesto por 5 módulos principales:

### 1. **Panel Web de Administración** ✅ IMPLEMENTADO
Aplicación Next.js completa para gestión operativa del personal administrativo.

**Características Principales:**
- ✅ Dashboard con métricas en tiempo real
- ✅ Sistema de autenticación con roles (Admin, Supervisor, Logística)
- ✅ Gestión completa de órdenes de servicio
- ✅ Administración de cuadrillas de trabajo
- ✅ Control total de inventario (bodega + cuadrillas)
- ✅ Sistema de reportes avanzado con múltiples formatos de exportación
- ✅ Modo oscuro/claro con next-themes
- ✅ Diseño responsive y moderno

### 2. **Backend API** ✅ IMPLEMENTADO
API RESTful robusta con endpoints organizados por entidad.

**Servicios Implementados:**
- ✅ `authHelpers.ts` - Autenticación y autorización JWT
- ✅ `orderService.ts` - Gestión de órdenes de servicio
- ✅ `crewService.ts` - Administración de cuadrillas
- ✅ `inventoryService.ts` - Control de inventario con transacciones
- ✅ `installerService.ts` - Gestión de técnicos instaladores
- ✅ `reportService.ts` - Generación de reportes con agregaciones MongoDB
- ✅ `orderHistoryService.ts` - Historial de cambios en órdenes
- ✅ `inventoryHistoryService.ts` - Trazabilidad de movimientos de inventario

### 3. **Aplicación Móvil (Instaladores)** 🚧 EN DESARROLLO
React Native (Expo) para técnicos de campo.

**Funcionalidades Planificadas:**
- Login vinculado a modelo `User` e `Installer`
- Recepción de órdenes asignadas con notificaciones push
- Vista de detalles de orden (dirección, abonado, tipo)
- Navegación GPS a ubicación
- Actualización de estados (en camino, en sitio, completada)
- Formulario de cierre con materiales usados, firma digital y fotos

### 4. **Motor de Automatización (n8n)** 🚧 CONFIGURADO
Workflows inteligentes para automatización de procesos.

**Flujos Implementados:**
- 📥 **Recepción de Órdenes vía WhatsApp:**
  1. Escucha mensajes en grupo/canal de WhatsApp
  2. Detecta imágenes de órdenes
  3. Extrae texto con GPT-4o Vision
  4. Convierte a JSON estructurado
  5. Crea orden automáticamente en MongoDB

- 📤 **Reporte Automático a Netuno:**
  1. Webhook al completar orden
  2. Recopila información (cliente, materiales, técnico)
  3. Envía POST a Google Form de Netuno

### 5. **Móvil Admin (Supervisión)** 📋 PLANIFICADO
App ligera para supervisores en campo.

---

## 🎯 Funcionalidades Implementadas

### 🏠 Dashboard Principal
- **Métricas en Tiempo Real:**
  - Total de órdenes por estado (pendiente, asignada, completada, cancelada)
  - Órdenes separadas por tipo (instalación/avería)
  - Rendimiento de cuadrillas
  - Alertas de inventario bajo stock

- **Gráficos y Visualización:**
  - Tarjetas de estadísticas con iconos dinámicos
  - Indicadores de tendencia
  - Filtros por período (hoy, semana, mes, año)

### 📋 Gestión de Órdenes
**Componentes:** `OrdersTable`, `NewOrderModal`, `OrderDetailsModal`, `AssignOrderModal`

- ✅ Crear órdenes manualmente o recibir de WhatsApp
- ✅ Asignar/reasignar órdenes a cuadrillas
- ✅ Actualizar estados del ciclo de vida
- ✅ Ver historial completo de cambios (`OrderHistory`)
- ✅ Filtros avanzados (estado, tipo, fecha, cuadrilla)
- ✅ Búsqueda por número de abonado, dirección, o código
- ✅ Paginación y ordenamiento
- ✅ Vista de detalles con toda la información

**Estados de Orden:**
- `pendiente` - Recibida, esperando asignación
- `asignada` - Asignada a cuadrilla específica
- `en-camino` - Técnico en tránsito
- `en-sitio` - Técnico trabajando en ubicación
- `completada` - Trabajo finalizado con éxito
- `cancelada` - Orden cancelada con motivo registrado

### 👥 Gestión de Cuadrillas (Crews)
**Componentes:** `CrewsTable`, `NewCrewForm`, `CrewEditForm`, `CrewInventoryCard`, `CrewMonthlySummary`, `CrewMovementHistory`

- ✅ Crear y editar cuadrillas con líder y miembros
- ✅ Asignar vehículos a cuadrillas
- ✅ Ver inventario asignado a cada cuadrilla en tiempo real
- ✅ **Resumen mensual de materiales:**
  - Selector de mes/año
  - Total de materiales asignados en el período
  - Total de materiales consumidos en órdenes
  - Balance por ítem de inventario
- ✅ **Historial de movimientos de inventario:**
  - Tipo de movimiento (asignación, consumo, devolución)
  - Fecha y hora exacta
  - Cantidad y material involucrado
  - Usuario que realizó el movimiento
  - Orden asociada (si aplica)
- ✅ Activar/desactivar cuadrillas
- ✅ Filtros por estado activo/inactivo

### 📦 Gestión de Inventario
**Componentes:** `InventoryTable`, `CreateItemModal`, `EditItemModal`, `ManageInstancesModal`, `AssignMaterialsModal`, `ReturnMaterialModal`

#### Sistema Dual de Inventario

**A) Materiales de Consumo** (`type: "material"`)
- Gestionados por **cantidad**
- Ejemplos: cable, conectores, grapas, cinta
- Control de stock central
- Asignación por cantidad a cuadrillas
- Seguimiento de consumo por orden

**B) Equipos Individuales** (`type: "equipment"`)
- Gestionados por **instancias individuales**
- Cada equipo tiene ID único (número de serie/MAC)
- Ejemplos: ONTs, modems, routers
- **Estados de instancia:**
  - `in-stock` - En bodega central
  - `assigned` - Asignado a cuadrilla
  - `installed` - Instalado en cliente
  - `damaged` - Averiado
  - `retired` - Dado de baja

**Funcionalidades de Inventario:**
- ✅ CRUD completo de ítems de inventario
- ✅ Categorización (material/equipment/tool)
- ✅ Control de stock mínimo con alertas
- ✅ **Gestión de instancias de equipos:**
  - Agregar equipos con ID único, serial, MAC
  - Asignar instancias específicas a cuadrillas
  - Marcar como instalada en orden específica
  - Rastrear ubicación de instalación
  - Reportar equipos dañados
- ✅ Reabastecer inventario central con registro de lotes
- ✅ Asignar materiales/equipos a cuadrillas
- ✅ Devolver materiales de cuadrillas a bodega
- ✅ Procesar consumo al completar órdenes
- ✅ Historial completo de movimientos con trazabilidad
- ✅ Snapshots diarios automáticos del estado de inventario
- ✅ Estadísticas de uso por período

**Servicios de Inventario (`inventoryService.ts`):**
```typescript
- restockInventory() - Reabastecer bodega central
- assignMaterialToCrew() - Asignar a cuadrilla
- returnMaterialFromCrew() - Devolver a bodega
- processOrderUsage() - Consumir en orden
- addEquipmentInstances() - Agregar equipos individuales
- assignInstanceToCrew() - Asignar equipo específico
- markInstanceAsInstalled() - Registrar instalación
- getAvailableInstances() - Consultar disponibles
- getInstanceById() - Buscar equipo por ID
- updateInstance() - Actualizar estado de equipo
- deleteInstance() - Eliminar equipo
```

### 📊 Sistema de Reportes
**Componentes:** `ReportFilters`, `ReportTable`, `ExportActions`, `ReportHistoryDrawer`

#### Tipos de Reportes Disponibles

**1. Reporte Diario** (`getDailyReport`)
- Órdenes finalizadas y asignadas por fecha específica
- Filtro por tipo (instalación/avería/todas)
- Desglose por estado
- Listado detallado de órdenes

**2. Reporte Mensual** (`getMonthlyReport`)
- Resumen del mes completo
- Desglose día por día
- Totales agregados (finalizadas/asignadas)
- Tendencias del período

**3. Reporte de Inventario** (`getInventoryReport`)
- Material en instalaciones
- Material en averías
- Material averiado
- Material recuperado
- Rango de fechas configurable
- Totales por ítem

**4. Reporte Netuno** (`getNetunoOrdersReport`)
- Órdenes pendientes de reportar a Google Forms
- Órdenes ya reportadas
- Información lista para envío a Netuno

**5. Rendimiento por Cuadrilla** (`getCrewPerformanceReport`)
- Instalaciones realizadas por cuadrilla
- Averías completadas por cuadrilla
- Total de órdenes por equipo
- Ranking de productividad
- Período configurable

**6. Inventario por Cuadrilla** (`getCrewInventoryReport`)
- Estado actual de materiales asignados
- Desglose por cuadrilla
- Inventario disponible de cada equipo
- Vista general o por cuadrilla específica

#### Funcionalidades de Reportes
- ✅ Filtros dinámicos (fecha, tipo, cuadrilla)
- ✅ **Exportación múltiple formato:**
  - 📗 **Excel** (xlsx con estilos) - Tablas formateadas con colores
  - 📕 **PDF** (jsPDF) - Documento imprimible con tablas
  - 📘 **Word** (docx) - Documento editable para reportes corporativos
- ✅ Historial de reportes generados
- ✅ Almacenamiento de reportes en MongoDB (`GeneratedReport`)
- ✅ Regeneración de reportes previos
- ✅ Integración con n8n para envío automático
- ✅ Consideración de días feriados venezolanos
- ✅ Vistas responsivas con tablas adaptables

### 👤 Gestión de Usuarios
**Componentes:** `InstallerForm`, `InstallerCard`

- ✅ Crear usuarios administrativos
- ✅ Gestionar instaladores/técnicos
- ✅ Roles: `admin`, `supervisor`, `logistica`, `installer`
- ✅ Vincular instalador con usuario para acceso móvil
- ✅ Actualizar información de contacto
- ✅ Desactivar usuarios

---

## 🗄️ Modelos de Base de Datos

### `User.ts`
```typescript
{
  email: string (unique)
  passwordHash: string
  role: 'admin' | 'supervisor' | 'logistica' | 'installer'
  name: string
  createdAt: Date
}
```

### `Order.ts`
```typescript
{
  subscriberNumber: string
  subscriberName: string
  address: string
  type: 'instalacion' | 'averia'
  status: 'pendiente' | 'asignada' | 'en-camino' | ...
  assignedCrew?: ObjectId (ref: Crew)
  priority: 'baja' | 'media' | 'alta' | 'urgente'
  description?: string
  materialsUsed?: [{item, quantity, batchCode}]
  completionDetails?: {...}
  reportedToNetuno: boolean
  reportedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### `Crew.ts`
```typescript
{
  name: string
  leader: ObjectId (ref: Installer)
  members: ObjectId[] (ref: Installer)
  vehiclesAssigned?: [{id, name}]
  isActive: boolean
  assignedInventory: [{
    item: ObjectId (ref: Inventory)
    quantity: number
    lastUpdated?: Date
  }]
  createdAt: Date
  updatedAt: Date
}
```

### `Inventory.ts`
```typescript
{
  code: string (unique)
  description: string
  unit: string
  currentStock: number
  minimumStock: number
  type: 'material' | 'equipment' | 'tool'
  
  // Solo para type === 'equipment'
  instances: [{
    uniqueId: string (unique)
    serialNumber?: string
    macAddress?: string
    status: 'in-stock' | 'assigned' | 'installed' | 'damaged' | 'retired'
    assignedTo?: {crewId, orderId, assignedAt}
    installedAt?: {orderId, installedDate, location}
    notes?: string
    createdAt: Date
  }]
  
  createdAt: Date
  updatedAt: Date
}
```

### `InventoryHistory.ts`
```typescript
{
  itemId: ObjectId (ref: Inventory)
  type: 'restock' | 'assign_to_crew' | 'return_from_crew' | 'used_in_order'
  quantity: number
  originCrew?: ObjectId
  destinationCrew?: ObjectId
  orderId?: ObjectId
  userId?: ObjectId
  reason?: string
  createdAt: Date
}
```

### `InventorySnapshot.ts`
```typescript
{
  snapshotDate: Date
  warehouseStock: [{item, quantity, currentStock}]
  crewInventories: [{crew, inventory: [{item, quantity}]}]
  totalValueEstimate?: number
  createdAt: Date
}
```

### `GeneratedReport.ts`
```typescript
{
  name: string
  reportType: 'daily' | 'monthly' | 'inventory' | ...
  filters: {...}
  data: Mixed (JSON del reporte)
  generatedBy?: ObjectId (ref: User)
  createdAt: Date
}
```

### `Installer.ts`
```typescript
{
  name: string
  phone: string
  userId?: ObjectId (ref: User)
  isActive: boolean
  createdAt: Date
}
```

### `OrderHistory.ts`
```typescript
{
  orderId: ObjectId (ref: Order)
  changedBy?: ObjectId (ref: User)
  changeType: string
  previousValue?: Mixed
  newValue?: Mixed
  description?: string
  createdAt: Date
}
```

---

## 🎨 Componentes UI Reutilizables

### Visualización de Datos
- ✅ `Table` - Tablas con selección, paginación, ordenamiento
- ✅ `Chip` - Badges para estados (con colores semánticos)
- ✅ `Card` - Contenedores de información  
- ✅ `User` - Avatar + nombre + metadata
- ✅ `Skeleton` - Placeholders de carga
- ✅ `Accordion` - Secciones expandibles

### Formularios
- ✅ `Input` - Campos de texto con validación
- ✅ `Autocomplete` - Búsqueda en listas largas
- ✅ `Select` - Selectores de opciones
- ✅ `Textarea` - Campos de texto largo
- ✅ `Switch` - Interruptores binarios
- ✅ `Button` - Botones con estados de carga
- ✅ `Radio` - Opciones excluyentes
- ✅ `Form` - Contenedor de formularios validados

### Navegación
- ✅ `Modal` - Ventanas emergentes
- ✅ `Drawer` - Panel lateral deslizable
- ✅ `Navbar` - Barra superior
- ✅ `Sidebar` - Menú lateral con navegación
- ✅ `Dropdown` - Menús desplegables
- ✅ `Pagination` - Navegación de páginas
- ✅ `Tabs` - Pestañas de contenido
- ✅ `Breadcrumbs` - Migas de pan

### Feedback
- ✅ `Tooltip` - Información contextual
- ✅ `Toast` - Notificaciones temporales
- ✅ `Spinner` - Indicadores de carga
- ✅ `Progress` - Barras de progreso
- ✅ `Alert` - Mensajes de advertencia/información
- ✅ `Divider` - Separadores visuales

### Iconografía
- ✅ `dashboard-icons.tsx` - Iconos del dashboard
- ✅ `icons.tsx` - Iconos generales del sistema

---

## 🎨 Sistema de Diseño

### Paleta de Colores
Configurada en `tailwind.config.js`:

```javascript
colors: {
  primary: '#3e78b2',    // Azul corporativo
  secondary: '#ffd166',  // Amarillo/Dorado
  success: '#06d6a0',    // Verde
  warning: '#ef476f',    // Rojo/Rosa
  danger: '#e63946',     // Rojo intenso
}
```

### Tema Oscuro/Claro
- ✅ Implementado con `next-themes`
- ✅ Persistencia de preferencia del usuario
- ✅ Componente `theme-switch.tsx`
- ✅ Colores semánticos adaptables

### Responsive Design
- ✅ Mobile first
- ✅ Breakpoints de Tailwind CSS
- ✅ Navegación adaptable (sidebar/hamburger)
- ✅ Tablas con scroll horizontal en móvil

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- npm o yarn
- MongoDB 6.0+
- Git

### 1. Clonar Repositorio
```bash
git clone <repository-url>
cd servitelvgi-web
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/serviteldb
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Build para Producción
```bash
npm run build
npm start
```

---

## 📁 Estructura del Proyecto

```
servitelvgi-web/
├── app/                      # App Router de Next.js
│   ├── api/                  # API Routes (Backend)
│   │   ├── web/
│   │   │   ├── auth/         # Endpoints de autenticación
│   │   │   ├── orders/       # CRUD de órdenes
│   │   │   ├── crews/        # Gestión de cuadrillas
│   │   │   ├── inventory/    # Control de inventario
│   │   │   │   └── instances/# Gestión de instancias de equipos
│   │   │   ├── installers/   # Gestión de técnicos
│   │   │   ├── reports/      # Generación de reportes
│   │   │   └── users/        # Gestión de usuarios
│   ├── dashboard/            # Páginas del panel admin
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── orders/           # Página de órdenes
│   │   ├── crews/            # Página de cuadrillas
│   │   │   └── [id]/         # Detalle de cuadrilla
│   │   ├── inventory/        # Página de inventario
│   │   ├── installers/       # Página de instaladores
│   │   └── reports/          # Página de reportes
│   ├── create-admin/         # Creación de primer admin
│   ├── layout.tsx            # Layout raíz
│   ├── page.tsx              # Página de login
│   └── providers.tsx         # Providers de Next.js
├── components/               # Componentes React
│   ├── dashboard/            # Componentes del dashboard
│   ├── orders/               # Componentes de órdenes
│   ├── crews/                # Componentes de cuadrillas
│   ├── inventory/            # Componentes de inventario
│   ├── installers/           # Componentes de instaladores
│   ├── reports/              # Componentes de reportes
│   ├── login/                # Componentes de login
│   ├── Navbar.tsx            # Barra de navegación
│   └── sidebar.tsx           # Menú lateral
├── lib/                      # Servicios y utilidades
│   ├── db.ts                 # Conexión a MongoDB
│   ├── authHelpers.ts        # Helpers de autenticación
│   ├── orderService.ts       # Lógica de órdenes
│   ├── crewService.ts        # Lógica de cuadrillas
│   ├── inventoryService.ts   # Lógica de inventario (43KB)
│   ├── installerService.ts   # Lógica de instaladores
│   ├── reportService.ts      # Lógica de reportes
│   ├── orderHistoryService.ts
│   ├── inventoryHistoryService.ts
│   ├── exports/              # Exportadores
│   │   ├── exportToExcel.ts
│   │   ├── exportToPDF.ts
│   │   └── exportToWord.ts
│   └── utils/
├── models/                   # Modelos de Mongoose
│   ├── User.ts
│   ├── Order.ts
│   ├── Crew.ts
│   ├── Inventory.ts
│   ├── Installer.ts
│   ├── InventoryHistory.ts
│   ├── InventorySnapshot.ts
│   ├── OrderHistory.ts
│   └── GeneratedReport.ts
├── types/                    # Tipos de TypeScript
│   ├── inventory.ts
│   └── reportTypes.ts
├── contexts/                 # React Contexts
├── config/                   # Configuraciones
├── public/                   # Archivos estáticos
├── styles/                   # Estilos globales
├── proxy.ts                  # Middleware de autenticación
├── tailwind.config.js        # Configuración de Tailwind
├── next.config.js            # Configuración de Next.js
├── tsconfig.json             # Configuración de TypeScript
└── package.json              # Dependencias
```

---

## 🔒 Seguridad

- ✅ Autenticación JWT con tokens seguros
- ✅ Hash de contraseñas con bcryptjs
- ✅ Middleware de autenticación en todas las rutas protegidas
- ✅ Validación de roles por endpoint
- ✅ Sanitización de inputs
- ✅ Protección CSRF (Next.js built-in)
- ✅ Rate limiting (por implementar)

---

## 🧪 Testing (Planificado)

- Unit tests con Jest
- Integration tests con Supertest
- E2E tests con Playwright
- Component tests con React Testing Library

---

## 📈 Roadmap Futuro

### Corto Plazo
- [ ] Implementar notificaciones push (Firebase Cloud Messaging)
- [ ] Aplicación móvil completa para instaladores
- [ ] Panel de métricas avanzadas con gráficos (Chart.js/Recharts)
- [ ] Sistema de chat interno entre oficina y campo

### Mediano Plazo
- [ ] Rastreo GPS en tiempo real de cuadrillas
- [ ] Módulo de planificación de rutas optimizadas
- [ ] Sistema de tickets de soporte
- [ ] Integración con ERP/Contabilidad

### Largo Plazo
- [ ] App móvil para supervisores
- [ ] Machine Learning para predicción de tiempos
- [ ] Análisis predictivo de inventario
- [ ] Portal de autogestión para clientes

---

## 👥 Roles y Permisos

| Rol | Dashboard | Órdenes | Cuadrillas | Inventario | Reportes | Usuarios |
|-----|-----------|---------|------------|------------|----------|----------|
| **Admin** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Todos | ✅ CRUD |
| **Supervisor** | ✅ | ✅ Ver/Editar | ✅ Ver | ✅ Ver | ✅ Consultar | ❌ |
| **Logística** | ✅ | ✅ Ver/Asignar | ✅ Ver | ✅ CRUD | ✅ Inventario | ❌ |
| **Installer** | ❌ | ✅ Asignadas (Móvil) | ❌ | ❌ | ❌ | ❌ |

---

## 🤝 Contribución

Este es un proyecto privado de Servitel. Para contribuir:

1. Crear branch desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits descriptivos
3. Crear Pull Request con descripción detallada
4. Esperar revisión de código
5. Merge después de aprobación

---

## 📝 Licencia

Propietario: Servitel  
Todos los derechos reservados © 2025

---

## 📞 Contacto y Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Última actualización:** Diciembre 2024  
**Versión:** 0.0.1  
**Estado:** En producción activa