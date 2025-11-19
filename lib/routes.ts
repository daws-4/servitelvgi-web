// lib/routes.ts

export const LOGIN_ROUTE = "/";
export const DEFAULT_REDIRECT = "/dashboard";

// Rutas descubiertas en el proyecto (páginas y endpoints API)
export const ROUTES = {
  // Páginas públicas / login
  auth: {
    login: LOGIN_ROUTE, // app/page.tsx (login root)
    legacyLogin: "/login", // redirección de compatibilidad
    forgotPassword: "/forgot-password",
  },

  // Dashboard web y subrutas
  dashboard: {
    root: "/dashboard",
    home: "/dashboard",
    orders: {
      list: "/dashboard/orders",
      create: "/dashboard/orders/create",
      detail: (id: string) => `/dashboard/orders/${id}`,
      edit: (id: string) => `/dashboard/orders/${id}/edit`,
    },
    inventory: {
      list: "/dashboard/inventory",
      movements: "/dashboard/inventory/movements",
    },
    installers: {
      list: "/dashboard/installers",
      detail: (id: string) => `/dashboard/installers/${id}`,
    },
    users: "/dashboard/users",
  },

  // API pública usada por integraciones (n8n), web admin, móvil, etc.
  api: {
    // Auth endpoints (app/api/auth/*)
    auth: {
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      createAdmin: "/api/auth/createAdmin",
    },

    // Agent endpoints (app/api/agent/*)
    agent: {
      getOrders: "/api/agent/getOrders",
    },

    // Web CRUD endpoints que exponen servicios (app/api/web/*)
    web: {
      orders: "/api/web/orders",
      installers: "/api/web/installers",
      inventories: "/api/web/inventories",
      inventoryHistories: "/api/web/inventory-histories",
      users: "/api/web/users",
    },

    // Placeholder para móviles si se añaden más rutas (no detectadas actualmente)
    mobile: {
      // rutas móviles pendientes de implementación
    },
  },
} as const;
