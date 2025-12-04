import React, { useState, useMemo } from "react";
import { Autocomplete, AutocompleteItem, AutocompleteProps } from "@heroui/react";

// Interfaz genérica para los items (pueden ser técnicos o materiales)
export interface Item {
    id: string | number;
    name: string;
    description?: string; // Opcional: para mostrar cargo o stock
    [key: string]: any;   // Permite propiedades extra
}

interface CustomAutocompleteProps<T extends Item> extends Omit<AutocompleteProps<T>, "children" | "items"> {
    items: T[]; // Lista de items que el componente mostrará
    label: string;
    placeholder?: string;
    isLoading?: boolean; // Opcional: para mostrar estado de carga
}

export const CustomAutocomplete = <T extends Item>({
    items,
    label,
    placeholder = "Escribe para buscar...",
    isLoading = false,
    ...props
}: CustomAutocompleteProps<T>) => {
    const [filterText, setFilterText] = useState("");

    // Filtramos los items basándonos en el texto ingresado
    const filteredItems = useMemo(() => {
        if (!filterText) {
            return items;
        }

        return items.filter((item) =>
            item.name.toLowerCase().includes(filterText.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(filterText.toLowerCase()))
        );
    }, [items, filterText]);

    return (
        <Autocomplete
            label={label}
            placeholder={placeholder}
            isLoading={isLoading}
            items={filteredItems}
            inputValue={filterText}
            onInputChange={setFilterText}
            variant="bordered"
            radius="sm"
            labelPlacement="outside"
            classNames={{
                base: "max-w-xs",
                listboxWrapper: "max-h-[320px]",
                selectorButton: "text-default-500",
            }}
            inputProps={{
                classNames: {
                    input: "ml-1",
                    inputWrapper: "h-[48px]",
                },
            }}
            listboxProps={{
                emptyContent: "No se encontraron resultados.",
            }}
            {...props}
        >
            {(item: T) => (
                <AutocompleteItem key={item.id} textValue={item.name}>
                    <div className="flex flex-col gap-1">
                        <span className="text-small font-bold">{item.name}</span>
                        {item.description && (
                            <span className="text-tiny text-default-500">{item.description}</span>
                        )}
                    </div>
                </AutocompleteItem>
            )}
        </Autocomplete>
    );
};

export default CustomAutocomplete;

// ### Cómo usarlo en tus Formularios

// **1. Para Seleccionar Técnicos:**
// Debes cargar los datos en el componente padre y pasarlos como prop:

// ```tsx
// import { useState, useEffect } from 'react';
// import CustomAutocomplete, { Item } from './Autocomplete';
//
// const MyForm = () => {
//     const [tecnicos, setTecnicos] = useState<Item[]>([]);
//     const [isLoading, setIsLoading] = useState(false);
//
//     useEffect(() => {
//         const loadTecnicos = async () => {
//             setIsLoading(true);
//             try {
//                 const res = await fetch('/api/installers');
//                 const json = await res.json();
//
//                 const mappedData = json.map((user: any) => ({
//                     id: user._id,
//                     name: user.fullName,
//                     description: user.role === 'admin' ? 'Administrador' : 'Instalador'
//                 }));
//
//                 setTecnicos(mappedData);
//             } catch (error) {
//                 console.error('Error cargando técnicos:', error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         loadTecnicos();
//     }, []);
//
//     return (
//         <CustomAutocomplete
//             label="Asignar Técnico"
//             items={tecnicos}
//             isLoading={isLoading}
//             placeholder="Busca por nombre..."
//             onSelectionChange={(key) => console.log("Técnico seleccionado:", key)}
//         />
//     );
// };
// ```

// **2. Para Seleccionar Materiales (Inventario):**

// ```tsx
// const MyInventoryForm = () => {
//     const [materiales, setMateriales] = useState<Item[]>([]);
//
//     useEffect(() => {
//         fetch('/api/inventory')
//             .then(res => res.json())
//             .then(json => {
//                 const mappedData = json.map((item: any) => ({
//                     id: item._id,
//                     name: item.name,
//                     description: `Stock disponible: ${item.currentStock}`
//                 }));
//                 setMateriales(mappedData);
//             });
//     }, []);
//
//     return (
//         <CustomAutocomplete
//             label="Material a Agregar"
//             items={materiales}
//             placeholder="Ej: Cable UTP..."
//         />
//     );
// };
// ```

// **3. Con datos estáticos:**

// ```tsx
// const staticItems: Item[] = [
//     { id: 1, name: "Opción 1", description: "Descripción 1" },
//     { id: 2, name: "Opción 2", description: "Descripción 2" },
//     { id: 3, name: "Opción 3", description: "Descripción 3" },
// ];
//
// <CustomAutocomplete
//     label="Selecciona una opción"
//     items={staticItems}
//     placeholder="Busca una opción..."
// />
// ```