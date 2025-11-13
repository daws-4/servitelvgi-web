# Sistema de Gestión de Órdenes (SGO) - Servitel

Este proyecto es un sistema integral para la gestión de operaciones de Servitel, contratista de Netuno. Su objetivo es digitalizar y automatizar el ciclo de vida completo de las órdenes de servicio (instalaciones y averías), desde su recepción por canales no estructurados (WhatsApp) hasta el reporte final en los sistemas del cliente (Google Forms).

---

## 🚀 Tecnologías Principales

* **Backend (Servidor):** Node.js (probablemente con Express.js o Fastify)
* **Base de Datos:** MongoDB (con Mongoose)
* **Frontend (Web Admin):** React.js (Next.js recomendado)
* **Aplicación Móvil (Instalador):** React Native
* **Agente IA / Automatización:** n8n
* **Integración de Mensajería:** WhatsApp Business API (Meta)

---

## 📦 Módulos del Sistema

El proyecto se divide en 5 componentes principales, como se define en la propuesta:

### 1. Servidor (Backend)
Es el núcleo central que orquesta toda la lógica de negocio y la comunicación entre módulos.

* **Responsabilidades:**
    * Exponer una API RESTful para el consumo de los clientes (Web y Móvil).
    * Lógica de negocio (asignación, estados de órdenes).
    * Autenticación y autorización (JWT).
    * Gestión de la base de datos (CRUD de Órdenes, Instaladores, Inventario).

### 2. Módulo Web (Panel de Administración)
La interfaz para el personal de oficina (Administradores, Logística, Supervisores) para gestionar la operación.

* **Funcionalidades Clave:**
    * Dashboard con métricas (órdenes pendientes, completadas, por técnico).
    * Gestión de Órdenes (crear manualmente, asignar a técnico, ver estado).
    * Gestión de Instaladores (crear, editar, ver inventario asignado).
    * Gestión de Inventario (stock central, asignación de material a técnicos, ver histórico).

### 3. Módulo Móvil (App del Instalador)
La herramienta de trabajo diaria para los técnicos en campo.

* **Funcionalidades Clave:**
    * Login (vinculado al modelo `User` y `Installer`).
    * Recepción de órdenes asignadas (con notificaciones push).
    * Ver detalles de la orden (dirección, abonado, tipo de trabajo).
    * Navegación GPS a la dirección.
    * Cambiar estado de la orden (en camino, en sitio, completada, cancelada).
    * **Reporte de Cierre:** Formulario para registrar materiales usados, capturar firma digital del cliente y tomar fotos de evidencia.

### 4. Agente IA (n8n)
El motor de automatización que conecta el sistema con servicios externos y elimina tareas manuales.

* **Flujos de Trabajo (Workflows):**
    * **Flujo 1: Recepción de Órdenes (WhatsApp):**
        1.  Escucha mensajes en un grupo/canal de WhatsApp (vía Meta API).
        2.  Filtra mensajes que contienen imágenes de órdenes.
        3.  Envía la imagen a una IA (OpenAI GPT-4o) para extraer el texto.
        4.  Formatea el texto extraído en un JSON.
        5.  Llama a la API del Backend para crear la `Orden` en MongoDB.
    * **Flujo 2: Reporte a Netuno (Google Forms):**
        1.  Detecta (vía webhook o polling) cuando una orden se marca como "Completada" en la base de datos.
        2.  Recopila toda la información de la orden (datos del cliente, materiales, técnico).
        3.  Realiza una solicitud HTTP (POST) al Google Form de Netuno para registrar la orden finalizada.

### 5. Móvil Admin (App de Supervisión)
Una versión ligera del panel web para supervisores en campo (a definir según la prioridad).

* **Funcionalidades Posibles:**
    * Dashboard rápido (pendientes vs. completadas).
    * Capacidad de reasignar órdenes entre técnicos.
    * Ver ubicación de técnicos (si se implementa rastreo GPS).

---

## 🗺️ Pasos a Seguir (Roadmap de Desarrollo)

### Fase 1: Fundación y Núcleo del Backend
1.  **Base de Datos:** Definir y desplegar los modelos de MongoDB (¡Completado!).
2.  **API Inicial:** Crear el servidor (Node.js) y los endpoints CRUD básicos para `Órdenes`, `Instaladores` e `Inventario`.
3.  **Autenticación:** Implementar la autenticación de usuarios (login) con JWT para los roles `admin` e `installer`.

### Fase 2: Automatización de Entrada (n8n)
1.  **Desplegar n8n:** Configurar la instancia de n8n en un servidor (ej. Render).
2.  **Conectar WhatsApp:** Configurar la API de WhatsApp Business (Meta) y conectarla a n8n.
3.  **Flujo de Recepción (IA):** Crear el workflow que lee las imágenes de WhatsApp, usa IA para procesarlas y llama a la API (Fase 1) para crear la `Orden` en la base de datos.

### Fase 3: Módulo Web (Administración)
1.  **Estructura:** Iniciar el proyecto en React (Next.js).
2.  **Vistas de Gestión:** Desarrollar las interfaces para ver, filtrar y (lo más importante) **asignar** las órdenes que llegan automáticamente desde n8n.
3.  **Gestión de Inventario:** Crear las vistas para manejar el stock central y asignar material a los instaladores.

### Fase 4: Módulo Móvil (Instaladores)
1.  **Estructura:** Iniciar el proyecto en React Native (Expo).
2.  **Flujo del Técnico:** Implementar el login, la lista de órdenes asignadas y la vista de detalles.
3.  **Formulario de Cierre:** Crear el formulario clave donde el técnico reporta el cierre (materiales, firma, fotos) y actualiza el estado de la `Orden` a "Completada".

### Fase 5: Cierre del Ciclo (Integración Final)
1.  **Flujo de Reporte (n8n):** Crear el segundo workflow en n8n que se activa cuando una orden cambia a "Completada".
2.  **Google Forms:** Configurar el nodo (HTTP Request) para enviar los datos de la orden cerrada al formulario de Netuno.
3.  **Pruebas End-to-End:** Realizar pruebas completas del sistema (desde la recepción en WhatsApp hasta el reporte final en Google Forms).