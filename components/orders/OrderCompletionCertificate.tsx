import React, { forwardRef } from 'react';
import { OrderEditData } from './OrderEditForm';
import { SatelliteIcon } from '@/components/dashboard-icons';

interface OrderCompletionCertificateProps {
    data: OrderEditData;
}

export const OrderCompletionCertificate = forwardRef<HTMLDivElement, OrderCompletionCertificateProps>(({ data }, ref) => {
    // Filter only materials with quantity > 0
    const usedMaterials = data.materialsUsed?.filter(m => m.quantity > 0) || [];

    // Helper to format date
    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div ref={ref} className="bg-white p-8 w-[800px] mx-auto text-black font-sans" style={{ minHeight: '1000px' }}>
            {/* HEADER */}
            <div className="flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white p-2 rounded-lg">
                        <SatelliteIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-primary tracking-wider">ENLARED</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Telecomunicaciones</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">FORMATO DE FINALIZACIÓN</h2>
                    <p className="text-sm text-gray-600">Orden #{data.ticket_id || data.subscriberNumber}</p>
                </div>
            </div>

            {/* SUBSCRIBER INFO */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 mb-3 pb-1">Datos del Abonado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Abonado:</span>
                        <span className="font-medium text-lg">{data.subscriberName}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Número de Abonado:</span>
                        <span className="font-medium">{data.subscriberNumber}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold text-gray-600 block text-xs">Dirección:</span>
                        <span className="font-medium">{data.address}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Teléfonos:</span>
                        <span className="font-medium">{data.phones}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Correo:</span>
                        <span className="font-medium">{data.email || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* TECHNICAL DETAILS */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 mb-3 pb-1">Detalles Técnicos</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Tipo de Orden:</span>
                        <span className="uppercase font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">{data.type}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-xs">Nodo:</span>
                        <span className="font-medium">{data.node || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold text-gray-600 block text-xs">Servicios / Trabajo Realizado:</span>
                        <span className="font-medium">{data.servicesToInstall || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* MATERIALS USED - PRIORITIZED */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 mb-3 pb-1">Materiales Utilizados</h3>
                {usedMaterials.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="border-b border-gray-200 py-2 px-2 font-semibold text-xs text-gray-600 w-24">Código</th>
                                <th className="border-b border-gray-200 py-2 px-2 font-semibold text-xs text-gray-600">Descripción</th>
                                <th className="border-b border-gray-200 py-2 px-2 font-semibold text-xs text-gray-600 w-20 text-right">Cant.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usedMaterials.map((mat: any, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-2 px-2 text-gray-700 font-mono text-xs">{mat.item.code}</td>
                                    <td className="py-2 px-2 text-gray-800">{mat.item.description}</td>
                                    <td className="py-2 px-2 text-gray-800 text-right font-bold">{mat.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 italic text-sm py-2">No se registraron materiales utilizados.</p>
                )}
            </div>

            {/* SPEEDTEST */}
            {data.internetTest && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 mb-3 pb-1">Prueba de Velocidad</h3>
                    <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 uppercase">Descarga</span>
                            <span className="block text-xl font-bold text-green-600">{data.internetTest.downloadSpeed || 0} <span className="text-xs text-gray-400 font-normal">Mbps</span></span>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <span className="block text-xs text-gray-500 uppercase">Carga</span>
                            <span className="block text-xl font-bold text-blue-600">{data.internetTest.uploadSpeed || 0} <span className="text-xs text-gray-400 font-normal">Mbps</span></span>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <span className="block text-xs text-gray-500 uppercase">Ping</span>
                            <span className="block text-xl font-bold text-gray-700">{data.internetTest.ping || 0} <span className="text-xs text-gray-400 font-normal">ms</span></span>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <span className="block text-xs text-gray-500 uppercase">Señal</span>
                            <span className="block text-sm font-medium text-gray-700 mt-1">{data.internetTest.wifiSSID || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SIGNATURE & FOOTER */}
            <div className="mt-12 flex justify-between items-end">
                <div className="w-64 text-center">
                    {data.customerSignature ? (
                        <div className="mb-2 border-b border-gray-300 pb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={data.customerSignature} alt="Firma Cliente" className="h-24 mx-auto object-contain" />
                        </div>
                    ) : (
                        <div className="h-24 border-b border-gray-300 mb-2"></div>
                    )}
                    <p className="text-xs font-bold text-gray-600 uppercase">Firma del Cliente</p>
                    <p className="text-[10px] text-gray-400">Acepto conforme el trabajo realizado</p>
                </div>

                <div className="w-64 text-center">
                    <div className="h-24 border-b border-gray-300 mb-2 flex items-end justify-center pb-2">
                        <span className="text-sm font-script text-gray-500 italic">Enlared Telecomunicaciones</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Técnico Responsable</p>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
                <p>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()} • ServitelV Web Platform</p>
            </div>
        </div>
    );
});

OrderCompletionCertificate.displayName = 'OrderCompletionCertificate';
