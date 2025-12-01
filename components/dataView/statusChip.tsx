import React from "react";
import { Chip, ChipProps } from "@heroui/react";

// Definimos los tipos de estado posibles según tu lógica de negocio
export type OrderStatus =
    | "pending"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "averia"; // Asumiendo que 'averia' es un tipo especial o estado crítico

interface StatusChipProps extends Omit<ChipProps, "children"> {
    status: string; // Recibimos el string del estado (puede venir de la DB)
}

// Mapa de configuración para cada estado
// Esto hace que sea muy fácil añadir nuevos estados en el futuro
const statusConfig: Record<string, { color: ChipProps["color"]; label: string; variant?: ChipProps["variant"] }> = {
    pending: {
        color: "warning",
        label: "Pendiente",
        variant: "flat",
    },
    assigned: {
        color: "primary", // Usará tu azul corporativo (#3e78b2) si está configurado en el tema
        label: "Asignada",
        variant: "flat",
    },
    in_progress: {
        color: "secondary", // O un azul más oscuro
        label: "En Progreso",
        variant: "dot",
    },
    completed: {
        color: "success",
        label: "Completada",
        variant: "flat",
    },
    cancelled: {
        color: "default",
        label: "Cancelada",
        variant: "solid",
    },
    averia: {
        color: "danger",
        label: "Avería",
        variant: "flat",
    },
    // Estado por defecto para valores desconocidos
    unknown: {
        color: "default",
        label: "Desconocido",
        variant: "bordered",
    },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
    // Buscamos la configuración, si no existe usamos 'unknown'
    const config = statusConfig[status] || statusConfig.unknown;

    return (
        <Chip
            color={config.color}
            variant={config.variant}
            size="sm" // Tamaño pequeño por defecto para tablas
            classNames={{
                content: "font-medium",
            }}
            {...props} // Permitimos pasar otras props de HeroUI como className o size
        >
            {config.label}
        </Chip>
    );
};

export default StatusChip;


// ### Cómo usarlo en tu `DataTable` u otras vistas

// Simplemente importa el componente y pásale el estado "crudo" que viene de tu base de datos.

// ```tsx
// import { StatusChip } from "@/components/ui/StatusChip";

// // Ejemplo dentro de una celda de tu tabla
// <StatusChip status="pending" />

// // Ejemplo con un estado que viene de una variable
// const orden = { id: 1, estado: "completed" };
// <StatusChip status={orden.estado} />