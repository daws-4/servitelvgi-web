import React from "react";
import { Chip, ChipProps } from "@heroui/react";
import { getStatusConfig } from "@/lib/orderConstants";

export type OrderStatus = string;

interface StatusChipProps extends Omit<ChipProps, "children"> {
    status: string; // Recibimos el string del estado (puede venir de la DB)
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
    // Buscamos la configuración, si no existe getStatusConfig ya provee un unknown fallback
    const config = getStatusConfig(status);

    return (
        <Chip
            color={config.color as ChipProps["color"]}
            variant={config.chipVariant as ChipProps["variant"]}
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