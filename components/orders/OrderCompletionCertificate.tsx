import React, { forwardRef } from 'react';
import { OrderEditData } from './OrderEditForm';
import { SatelliteIcon } from '@/components/dashboard-icons';

interface OrderCompletionCertificateProps {
    data: OrderEditData;
}

export const OrderCompletionCertificate = forwardRef<HTMLDivElement, OrderCompletionCertificateProps>(({ data }, ref) => {
    // Filter only materials with quantity > 0
    const usedMaterials = data.materialsUsed?.filter(m => m.quantity > 0) || [];

    // Colors constants (HEX for functionality)
    const colors = {
        primary: '#3e78b2',
        white: '#ffffff',
        gray50: '#f9fafb',
        gray100: '#f3f4f6',
        gray200: '#e5e7eb',
        gray300: '#d1d5db',
        gray400: '#9ca3af',
        gray500: '#6b7280',
        gray600: '#4b5563',
        gray700: '#374151',
        gray800: '#1f2937',
        green600: '#16a34a',
        blue600: '#2563eb',
        black: '#000000',
    };

    return (
        <div ref={ref} className="p-8 w-[800px] mx-auto font-sans" style={{ minHeight: '1000px', backgroundColor: colors.white, color: colors.black }}>
            {/* HEADER */}
            <div className="flex justify-between items-start pb-4 mb-6" style={{ borderBottom: `2px solid ${colors.primary}` }}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: colors.primary, color: colors.white }}>
                        <SatelliteIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider" style={{ color: colors.primary }}>ENLARED</h1>
                        <p className="text-xs uppercase tracking-widest" style={{ color: colors.gray500 }}>Telecomunicaciones</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold" style={{ color: colors.gray800 }}>FORMATO DE FINALIZACIÓN</h2>
                    <p className="text-sm" style={{ color: colors.gray600 }}>Orden #{data.ticket_id || data.subscriberNumber}</p>
                    {/* Technician Name in Header */}
                    {data.technicianName && (
                        <p className="text-sm font-medium mt-1" style={{ color: colors.primary }}>
                            Técnico Responsable: <span className="font-bold">{data.technicianName}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* SUBSCRIBER INFO */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase mb-3 pb-1" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Datos del Abonado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Abonado:</span>
                        <span className="font-medium text-lg">{data.subscriberName}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Número de Abonado:</span>
                        <span className="font-medium">{data.subscriberNumber}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Dirección:</span>
                        <span className="font-medium">{data.address}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Teléfonos:</span>
                        <span className="font-medium">{data.phones}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Correo:</span>
                        <span className="font-medium">{data.email || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* TECHNICAL DETAILS */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase mb-3 pb-1" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Detalles Técnicos</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold block text-xs mb-1" style={{ color: colors.gray600 }}>Tipo de Orden:</span>
                        {/* Fixed overlap by adding block/inline-block and padding */}
                        <div className="uppercase font-medium px-2 py-1 rounded text-xs inline-block" style={{ backgroundColor: colors.gray100 }}>
                            {data.type}
                        </div>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Nodo:</span>
                        <span className="font-medium">{data.node || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold block text-xs" style={{ color: colors.gray600 }}>Servicios / Trabajo Realizado:</span>
                        <span className="font-medium">{data.servicesToInstall || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* MATERIALS USED - PRIORITIZED */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase mb-3 pb-1" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Materiales Utilizados</h3>
                {usedMaterials.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left" style={{ backgroundColor: colors.gray50 }}>
                                <th className="py-2 px-2 font-semibold text-xs w-24" style={{ color: colors.gray600, borderBottom: `1px solid ${colors.gray200}` }}>Código</th>
                                <th className="py-2 px-2 font-semibold text-xs" style={{ color: colors.gray600, borderBottom: `1px solid ${colors.gray200}` }}>Descripción</th>
                                <th className="py-2 px-2 font-semibold text-xs w-20 text-right" style={{ color: colors.gray600, borderBottom: `1px solid ${colors.gray200}` }}>Cant.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usedMaterials.map((mat: any, idx) => (
                                <tr key={idx} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                                    <td className="py-2 px-2 font-mono text-xs" style={{ color: colors.gray700 }}>{mat.item.code}</td>
                                    <td className="py-2 px-2" style={{ color: colors.gray800 }}>{mat.item.description}</td>
                                    <td className="py-2 px-2 text-right font-bold" style={{ color: colors.gray800 }}>{mat.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="italic text-sm py-2" style={{ color: colors.gray500 }}>No se registraron materiales utilizados.</p>
                )}
            </div>

            {/* SPEEDTEST */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase mb-3 pb-1" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Prueba de Velocidad</h3>
                {data.internetTest ? (
                    <div className="grid grid-cols-4 gap-4 p-4 rounded-lg" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                        <div className="text-center">
                            <span className="block text-xs uppercase" style={{ color: colors.gray500 }}>Descarga</span>
                            <span className="block text-xl font-bold" style={{ color: colors.green600 }}>{data.internetTest.downloadSpeed || 0} <span className="text-xs font-normal" style={{ color: colors.gray400 }}>Mbps</span></span>
                        </div>
                        <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                            <span className="block text-xs uppercase" style={{ color: colors.gray500 }}>Carga</span>
                            <span className="block text-xl font-bold" style={{ color: colors.blue600 }}>{data.internetTest.uploadSpeed || 0} <span className="text-xs font-normal" style={{ color: colors.gray400 }}>Mbps</span></span>
                        </div>
                        <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                            <span className="block text-xs uppercase" style={{ color: colors.gray500 }}>Ping</span>
                            <span className="block text-xl font-bold" style={{ color: colors.gray700 }}>{data.internetTest.ping || 0} <span className="text-xs font-normal" style={{ color: colors.gray400 }}>ms</span></span>
                        </div>
                        <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                            <span className="block text-xs uppercase" style={{ color: colors.gray500 }}>Señal</span>
                            <span className="block text-sm font-medium mt-1" style={{ color: colors.gray700 }}>{data.internetTest.wifiSSID || 'N/A'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                        <p className="text-sm italic" style={{ color: colors.gray500 }}>No se realizó prueba de velocidad.</p>
                    </div>
                )}
            </div>

            {/* SIGNATURE & FOOTER */}
            <div className="mt-12 flex justify-center">
                <div className="w-64 text-center">
                    {data.customerSignature ? (
                        <div className="mb-2 pb-2" style={{ borderBottom: `1px solid ${colors.gray300}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.customerSignature}
                                alt="Firma Cliente"
                                className="h-24 mx-auto object-contain"
                                crossOrigin="anonymous" // Suggest CORS handling
                            />
                        </div>
                    ) : (
                        <div className="h-24 mb-2" style={{ borderBottom: `1px solid ${colors.gray300}` }}></div>
                    )}
                    <p className="text-xs font-bold uppercase" style={{ color: colors.gray600 }}>Firma del Cliente</p>
                    <p className="text-[10px]" style={{ color: colors.gray400 }}>Acepto conforme el trabajo realizado</p>
                </div>
            </div>

            <div className="mt-8 pt-4 text-center text-[10px]" style={{ borderTop: `1px solid ${colors.gray100}`, color: colors.gray400 }}>
                <p>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()} • ServitelV Web Platform</p>
            </div>
        </div>
    );
});

OrderCompletionCertificate.displayName = 'OrderCompletionCertificate';
