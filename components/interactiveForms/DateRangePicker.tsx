import React from "react";
import { DateRangePicker, DateRangePickerProps } from "@heroui/react";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";

interface DateFilterProps extends Omit<DateRangePickerProps, "children"> {
    onDateChange?: (range: { start: string; end: string } | null) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({
    onDateChange,
    label = "Filtrar por Fecha",
    ...props
}) => {

    // Manejador de cambio: convierte el objeto Date de HeroUI a strings ISO (YYYY-MM-DD)
    // para que sean fáciles de enviar a tu API o filtrar en MongoDB
    const handleChange = (range: any) => {
        if (range && range.start && range.end) {
            if (onDateChange) {
                onDateChange({
                    start: range.start.toString(), // "2025-01-01"
                    end: range.end.toString(),     // "2025-01-31"
                });
            }
        } else {
            if (onDateChange) onDateChange(null);
        }
    };

    return (
        <I18nProvider locale="es-ES">
            <DateRangePicker
                label={label}
                variant="bordered"
                radius="sm"
                labelPlacement="outside"
                visibleMonths={2} // Muestra 2 meses al abrir el calendario para rangos largos
                pageBehavior="single" // Navegación más intuitiva
                classNames={{
                    base: "max-w-xs",
                    label: "font-medium text-default-600",
                    inputWrapper: "border-default-300 hover:border-primary focus-within:border-primary bg-white dark:bg-transparent",
                }}
                // Traducciones y accesibilidad
                errorMessage="Selecciona un rango válido"
                onChange={handleChange}
                // Props adicionales que quieras pasar
                {...props}
            />
        </I18nProvider>
    );
};


export default DateFilter;

// "use client";
// import React, { useState } from "react";
// import { DateFilter } from "@/components/ui/DateFilter"; // Tu componente nuevo
// import { FormInput } from "@/components/ui/FormInput";   // Tu input de búsqueda

// export default function OrdersPage() {
//     // Estado para los filtros
//     const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
//     const [searchTerm, setSearchTerm] = useState("");

//     // Función para aplicar los filtros (simulada)
//     const handleFilter = () => {
//         console.log("Buscando:", searchTerm);
//         console.log("Rango de fechas:", dateRange);
//         // Aquí llamarías a tu API con estos parámetros
//     };

//     return (
//         <div className="p-6 space-y-4">
//             {/* Barra de Filtros */}
//             <div className="flex flex-wrap gap-4 items-end bg-default-50 p-4 rounded-lg border border-default-200">

//                 {/* Buscador de texto */}
//                 <FormInput
//                     isSearch
//                     placeholder="Buscar abonado, ID..."
//                     value={searchTerm}
//                     onValueChange={setSearchTerm}
//                     className="w-full sm:w-72"
//                 />

//                 {/* Selector de Fechas (Tu nuevo componente) */}
//                 <DateFilter
//                     label="Fecha de la Orden"
//                     onDateChange={setDateRange}
//                     className="w-full sm:w-72"
//                 />

//                 {/* Botón de acción (opcional, si no filtras en tiempo real) */}
//                 {/* <Button color="primary" onPress={handleFilter}>Filtrar</Button> */}
//             </div>

//             {/* Aquí iría tu <DataTable /> */}
//             <div className="mt-6 p-4 border rounded text-default-500">
//                 Resultados para: {dateRange ? `${dateRange.start} a ${dateRange.end}` : "Todas las fechas"}
//             </div>
//         </div>
//     );
// }