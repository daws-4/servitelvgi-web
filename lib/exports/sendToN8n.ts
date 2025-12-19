// lib/exports/sendToN8n.ts
// Cliente de webhook n8n para automatización de Google Forms/Sheets

import axios from "axios";
import type { ReportType, n8nResponse } from "@/types/reportTypes";
import { markOrdersAsReported } from "@/lib/reportService";

/**
 * Envía datos de reporte a webhook n8n
 * El webhook debe estar configurado en variables de entorno
 */
export async function sendReportToN8n(
  reportType: ReportType,
  data: any[],
  metadata?: any
): Promise<n8nResponse> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "N8N_WEBHOOK_URL no está configurado en variables de entorno. Consulta la guía de configuración n8n."
    );
  }

  try {
    // Transformar datos al formato esperado por n8n
    const payload = {
      reportType,
      data: transformDataForN8n(reportType, data),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: Array.isArray(data) ? data.length : 0,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    };

    // Enviar petición con retry logic
    const response = await sendWithRetry(webhookUrl, payload);

    // Si es reporte de Netuno, marcar órdenes como reportadas
    if (reportType === "netuno_orders" && data.length > 0) {
      const orderIds = data.map((order: any) => order._id);
      await markOrdersAsReported(orderIds);
    }

    return {
      success: true,
      message: "Reporte enviado exitosamente a n8n",
      recordsProcessed: Array.isArray(data) ? data.length : 0,
    };
  } catch (error: any) {
    console.error("Error enviando reporte a n8n:", error);
    return {
      success: false,
      message: "Error al enviar reporte a n8n",
      recordsProcessed: 0,
      errors: [error.message],
    };
  }
}

/**
 * Transforma datos según tipo de reporte al formato esperado por n8n
 */
function transformDataForN8n(reportType: ReportType, data: any): any {
  switch (reportType) {
    case "netuno_orders":
      // Formato para Google Forms: array de objetos con fields mapeados
      return data.map((order: any) => ({
        subscriberNumber: order.subscriberNumber,
        subscriberName: order.subscriberName,
        address: order.address,
        phones: Array.isArray(order.phones) ? order.phones.join(", ") : "",
        email: order.email || "",
        type: order.type,
        status: order.status,
        node: order.node || "",
        servicesToInstall: Array.isArray(order.servicesToInstall)
          ? order.servicesToInstall.join(", ")
          : "",
      }));

    case "daily_installations":
    case "daily_repairs":
    case "monthly_installations":
    case "monthly_repairs":
      // Formato para Google Sheets: array de arrays (filas)
      const allOrders = [...(data.finalizadas || []), ...(data.asignadas || [])];
      return allOrders.map((order: any) => [
        order.subscriberNumber,
        order.subscriberName,
        order.address,
        order.type,
        order.status,
        order.completionDate || order.assignmentDate || "",
        order.assignedTo?.name || "",
      ]);

    default:
      // Para otros tipos, enviar como está
      return data;
  }
}

/**
 * Envía petición con retry y exponential backoff
 */
async function sendWithRetry(
  url: string,
  payload: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(process.env.N8N_API_KEY && {
            "X-API-Key": process.env.N8N_API_KEY,
          }),
        },
        timeout: 30000, // 30 segundos
      });

      return response.data;
    } catch (error: any) {
      lastError = error;
      console.warn(`Intento ${attempt}/${maxRetries} falló:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
