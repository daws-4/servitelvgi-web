import React, { forwardRef } from 'react';
import { OrderEditData } from './OrderEditForm';
import Image from 'next/image';
import netunoLogo from './assets/netuno_logo.png';

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
        <div ref={ref} className="p-4 w-[800px] mx-auto font-sans" style={{ backgroundColor: colors.white, color: colors.black }}>
            {/* HEADER */}
            <div className="flex justify-between items-start pb-2 mb-3" style={{ borderBottom: `2px solid ${colors.primary}` }}>
                <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={netunoLogo.src}
                        alt="Netuno Logo"
                        width={126}
                        height={126}
                        style={{ objectFit: 'contain' }}
                    />
                    {/* <div>
                        <h1 className="text-xl font-bold tracking-wider" style={{ color: colors.primary }}>NETUNO</h1>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: colors.gray500 }}>Telecomunicaciones</p>
                    </div> */}
                </div>
                <div className="text-right">
                    <h2 className="text-base font-bold" style={{ color: colors.gray800 }}>FORMATO DE FINALIZACIÓN</h2>
                    <p className="text-xs" style={{ color: colors.gray600 }}>Orden #{data.ticket_id || data.subscriberNumber}</p>
                    {/* Finalization Date */}
                    {data.updatedAt && (
                        <p className="text-xs font-medium mt-0.5" style={{ color: colors.gray600 }}>
                            Fecha: <span className="font-bold">{new Date(data.updatedAt).toLocaleDateString()}</span>
                        </p>
                    )}
                    {/* Technician Name in Header */}
                    {data.technicianName && (
                        <p className="text-xs font-medium mt-0.5" style={{ color: colors.primary }}>
                            Técnico: <span className="font-bold">{data.technicianName}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* SUBSCRIBER INFO, TECHNICAL DETAILS & MATERIALS - CUSTOM COLUMN LAYOUT */}
            <div className="grid mb-3" style={{ gridTemplateColumns: '22% 22% 56%', gap: '0.75rem' }}>
                {/* SUBSCRIBER INFO - 28% */}
                <div>
                    <h3 className="text-xs font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Datos del Abonado</h3>
                    <div className="space-y-1.5 text-xs">
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Abonado:</span>
                            <span className="font-medium text-[10px] break-words">{data.subscriberName}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Nº Abonado:</span>
                            <span className="font-medium text-[10px]">{data.subscriberNumber}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Dirección:</span>
                            <span className="font-medium text-[10px] leading-tight break-words">{data.address?.substring(0, 50)}{data.address?.length > 50 ? '...' : ''}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Teléfonos:</span>
                            <span className="font-medium text-[10px] break-words">{data.phones}</span>
                        </div>
                    </div>
                </div>

                {/* TECHNICAL DETAILS - 28% */}
                <div>
                    <h3 className="text-xs font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Detalles Técnicos</h3>
                    <div className="space-y-1.5 text-xs">
                        <div>
                            <span className="font-semibold block text-[10px] mb-0.5" style={{ color: colors.gray600 }}>Tipo de Orden:</span>
                            <div className="uppercase font-medium px-1.5 py-0.5 rounded text-[10px] inline-block" style={{ backgroundColor: colors.gray100 }}>
                                {data.type}
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Nodo:</span>
                            <span className="font-medium text-[10px] break-words">{data.node || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Servicios / Trabajo Realizado:</span>
                            <span className="font-medium text-[10px] break-words">{data.servicesToInstall || 'N/A'}</span>
                        </div>
                        {/* New Technical Fields */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                                <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Potencia Nap:</span>
                                <span className="font-medium text-[10px]">{data.powerNap || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Potencia Roseta:</span>
                                <span className="font-medium text-[10px]">{data.powerRoseta || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold block text-[10px]" style={{ color: colors.gray600 }}>Puertos Restantes:</span>
                            <span className="font-medium text-[10px]">{data.remainingPorts !== undefined ? data.remainingPorts : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* MATERIALS USED - 44% - CODE AND QUANTITY ONLY */}
                <div>
                    <h3 className="text-xs font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Materiales Utilizados</h3>
                    {usedMaterials.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                            {usedMaterials.map((mat: any, idx) => (
                                <div key={idx} className="flex items-center justify-between px-2 py-1 rounded text-[9px]" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                    <span className="font-mono font-semibold break-words" style={{ color: colors.gray700 }}>{mat.item.code}</span>
                                    <span className="font-bold ml-2" style={{ color: colors.gray800 }}>×{mat.quantity}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="italic text-[9px] py-1" style={{ color: colors.gray500 }}>No se registraron materiales.</p>
                    )}
                </div>
            </div>

            {/* SPEEDTEST & SIGNATURE - SIDE BY SIDE */}
            <div className="grid grid-cols-3 gap-4 mb-3">
                {/* SPEEDTEST - TAKES 2 COLUMNS */}
                <div className="col-span-2">
                    <h3 className="text-xs font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Prueba de Velocidad</h3>
                    {data.internetTest ? (
                        <div className="grid grid-cols-4 gap-2 p-2 rounded" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                            <div className="text-center">
                                <span className="block text-[10px] uppercase mb-0.5" style={{ color: colors.gray500 }}>Descarga</span>
                                <span className="block text-base" style={{ color: colors.green600 }}>{data.internetTest.downloadSpeed || 0} <span className="text-[10px]" style={{ color: colors.gray400 }}>Mbps</span></span>
                            </div>
                            <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                                <span className="block text-[10px] uppercase mb-0.5" style={{ color: colors.gray500 }}>Carga</span>
                                <span className="block text-base" style={{ color: colors.blue600 }}>{data.internetTest.uploadSpeed || 0} <span className="text-[10px]" style={{ color: colors.gray400 }}>Mbps</span></span>
                            </div>
                            <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                                <span className="block text-[10px] uppercase mb-0.5" style={{ color: colors.gray500 }}>Ping</span>
                                <span className="block text-base" style={{ color: colors.gray700 }}>{data.internetTest.ping || 0} <span className="text-[10px]" style={{ color: colors.gray400 }}>ms</span></span>
                            </div>
                            <div className="text-center" style={{ borderLeft: `1px solid ${colors.gray200}` }}>
                                <span className="block text-[10px] uppercase mb-0.5" style={{ color: colors.gray500 }}>Señal</span>
                                <span className="block text-xs mt-0.5" style={{ color: colors.gray700 }}>{data.internetTest.wifiSSID || 'N/A'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 rounded text-center" style={{ backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                            <p className="text-xs italic" style={{ color: colors.gray500 }}>No se realizó prueba de velocidad.</p>
                        </div>
                    )}
                </div>

                {/* SIGNATURE - TAKES 1 COLUMN */}
                <div className="col-span-1">
                    <h3 className="text-xs font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Firma del Cliente</h3>
                    <div className="flex flex-col items-center">
                        {data.customerSignature ? (
                            <div className="mb-1 pb-1 w-full" style={{ borderBottom: `1px solid ${colors.gray300}` }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={data.customerSignature}
                                    alt="Firma Cliente"
                                    className="h-16 mx-auto object-contain"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        ) : (
                            <div className="h-16 mb-1 w-full" style={{ borderBottom: `1px solid ${colors.gray300}` }}></div>
                        )}
                        <p className="text-[10px] text-center" style={{ color: colors.gray400 }}>Acepto conforme el trabajo realizado</p>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-4 pt-2 text-center text-[10px]" style={{ borderTop: `1px solid ${colors.gray100}`, color: colors.gray400 }}>
                <p>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()} • ENLARED Web Platform</p>
            </div>
        </div>
    );
});

OrderCompletionCertificate.displayName = 'OrderCompletionCertificate';
