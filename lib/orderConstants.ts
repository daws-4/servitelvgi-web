// lib/orderConstants.ts
// Centralización de statuses y tipos de orden
// Para agregar/quitar un status, solo modifica este archivo y el enum en Order.ts

export interface StatusConfig {
  label: string;
  color: string;       // HeroUI color: "warning" | "primary" | "secondary" | "success" | "default" | "danger"
  icon: string;        // FontAwesome icon name (sin el prefijo fa-solid fa-)
  hexColor: string;    // Color hex para la app móvil (texto/foreground). Se sirve via /api/web/order-config
  hexBgColor: string;  // Color hex claro para la app móvil (fondo de badges). Se sirve via /api/web/order-config
  badgeClass: string;  // Tailwind classes para badges personalizados
  dotColor: string;    // Tailwind class para el punto de color (OrdersTable)
  bgColor: string;     // Tailwind class para fondo
  textColor: string;   // Tailwind class para texto
  borderColor: string; // Tailwind class para borde
  description: string; // Descripción corta del status
  isTerminal: boolean; // ¿Es un estado final? (no se espera que cambie)
  countsAsCompleted: boolean; // ¿Cuenta como "completada" en reportes?
  chipVariant: "flat" | "solid" | "dot" | "bordered"; // Variante del chip HeroUI
}

export const ORDER_STATUSES: Record<string, StatusConfig> = {
  pending: {
    label: "Pendiente",
    color: "warning",
    icon: "clock",
    hexColor: "#ca8a04",
    hexBgColor: "#fef9c3",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
    description: "Orden creada, pendiente de asignación.",
    isTerminal: false,
    countsAsCompleted: false,
    chipVariant: "flat",
  },
  assigned: {
    label: "Asignada",
    color: "primary",
    icon: "user-check",
    hexColor: "#2563eb",
    hexBgColor: "#dbeafe",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    description: "Cuadrilla notificada. En espera de inicio.",
    isTerminal: false,
    countsAsCompleted: false,
    chipVariant: "flat",
  },
  in_progress: {
    label: "En Progreso",
    color: "secondary",
    icon: "spinner",
    hexColor: "#7c3aed",
    hexBgColor: "#ede9fe",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    dotColor: "bg-indigo-500",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-800",
    borderColor: "border-indigo-200",
    description: "La cuadrilla está trabajando en el sitio.",
    isTerminal: false,
    countsAsCompleted: false,
    chipVariant: "dot",
  },
  completed: {
    label: "Completada",
    color: "success",
    icon: "check",
    hexColor: "#16a34a",
    hexBgColor: "#dcfce7",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    description: "Trabajo finalizado y reportado.",
    isTerminal: true,
    countsAsCompleted: true,
    chipVariant: "flat",
  },
  completed_special: {
    label: "Completada Especial",
    color: "primary",
    icon: "star",
    hexColor: "#00897b",
    hexBgColor: "#e0f2f1",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    dotColor: "bg-teal-500",
    bgColor: "bg-teal-100",
    textColor: "text-teal-800",
    borderColor: "border-teal-200",
    description: "Completada con condiciones especiales.",
    isTerminal: true,
    countsAsCompleted: true,
    chipVariant: "flat",
  },
  completed_via500: {
    label: "Completada Vía 500",
    color: "primary",
    icon: "road",
    hexColor: "#06b6d4",
    hexBgColor: "#cffafe",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dotColor: "bg-cyan-500",
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-800",
    borderColor: "border-cyan-200",
    description: "Completada vía 500.",
    isTerminal: true,
    countsAsCompleted: true,
    chipVariant: "flat",
  },
  cancelled: {
    label: "Cancelada",
    color: "default",
    icon: "xmark",
    hexColor: "#dc2626",
    hexBgColor: "#fee2e2",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    description: "Orden cancelada por el operador.",
    isTerminal: true,
    countsAsCompleted: false,
    chipVariant: "solid",
  },
  hard: {
    label: "Hard",
    color: "warning",
    icon: "bolt",
    hexColor: "#ea580c",
    hexBgColor: "#fff7ed",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-200",
    description: "Orden Hard. Requiere atención especial.",
    isTerminal: false,
    countsAsCompleted: false,
    chipVariant: "solid",
  },
  visita: {
    label: "Visita",
    color: "success",
    icon: "eye",
    hexColor: "#16a34a",
    hexBgColor: "#dcfce7",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    description: "Visita técnica realizada.",
    isTerminal: true,
    countsAsCompleted: false,
    chipVariant: "flat",
  },
};

// --- Derived helpers ---

/** All valid status keys */
export type OrderStatus = keyof typeof ORDER_STATUSES;
export const VALID_STATUSES = Object.keys(ORDER_STATUSES) as OrderStatus[];

/** Statuses that count as "completed" in reports and dashboard */
export const COMPLETED_STATUSES = Object.entries(ORDER_STATUSES)
  .filter(([, v]) => v.countsAsCompleted)
  .map(([k]) => k) as OrderStatus[];

/** Terminal statuses (order lifecycle ended) */
export const TERMINAL_STATUSES = Object.entries(ORDER_STATUSES)
  .filter(([, v]) => v.isTerminal)
  .map(([k]) => k) as OrderStatus[];

/** Non-terminal statuses (order still active / sin completar) */
export const ACTIVE_STATUSES = Object.entries(ORDER_STATUSES)
  .filter(([, v]) => !v.isTerminal)
  .map(([k]) => k) as OrderStatus[];

/** Get config for a status, with fallback */
export function getStatusConfig(status: string): StatusConfig {
  return ORDER_STATUSES[status] || {
    label: status || "Desconocido",
    color: "default",
    icon: "question",
    hexColor: "#6b7280",
    hexBgColor: "#f3f4f6",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
    description: "Estado desconocido.",
    isTerminal: false,
    countsAsCompleted: false,
    chipVariant: "bordered",
  };
}

/** Status options for select/filter dropdowns (includes "all" option) */
export function getStatusFilterOptions(includeAll = true) {
  const options = Object.entries(ORDER_STATUSES).map(([key, config]) => ({
    key,
    label: config.label,
  }));

  if (includeAll) {
    return [{ key: "all", label: "Estado: Todos" }, ...options];
  }
  return options;
}

// --- Order Types ---

export const ORDER_TYPES = {
  instalacion: { label: "Instalación", icon: "wrench", color: "purple" },
  averia: { label: "Avería", icon: "triangle-exclamation", color: "red" },
  recuperacion: { label: "Recuperación", icon: "box-archive", color: "blue" },
  otro: { label: "Otro", icon: "question", color: "gray" },
} as const;

export type OrderType = keyof typeof ORDER_TYPES;
export const VALID_TYPES = Object.keys(ORDER_TYPES) as OrderType[];
