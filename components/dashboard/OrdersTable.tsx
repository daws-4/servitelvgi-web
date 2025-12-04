import React from "react";

export const OrdersTable = () => {
    return (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
            <div className="p-6 border-b border-neutral/10 flex justify-between items-center">
                <h3 className="font-bold text-dark">Órdenes Recientes</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-dark">Filtrar</button>
                    <button className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-secondary">Exportar</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-dark">
                    <thead className="bg-gray-50 text-neutral font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID Orden</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Técnico</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral/10">
                        <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium">#NET-2025</td>
                            <td className="px-6 py-4">Ana García</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Instalación</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">En Proceso</span></td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs">L</div>
                                Luis P.
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-neutral hover:text-secondary">•••</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium">#NET-2024</td>
                            <td className="px-6 py-4">Empresa XYZ</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Avería</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Completada</span></td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">C</div>
                                Carlos M.
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-neutral hover:text-secondary">•••</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium">#NET-2023</td>
                            <td className="px-6 py-4">Jorge Torres</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Instalación</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">Pendiente</span></td>
                            <td className="px-6 py-4 text-neutral italic">-- Sin asignar --</td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-primary hover:text-secondary font-medium text-xs">Asignar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
