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
            <div className="flex justify-between items-center pb-2 mb-3" style={{ borderBottom: `2px solid ${colors.primary}` }}>
                {/* LEFT: LOGO */}
                <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={netunoLogo.src}
                        alt="Netuno Logo"
                        width={126}
                        height={126}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* CENTER: TITLE & ORDER INFO */}
                <div className="text-center absolute left-1/2 transform -translate-x-1/2">
                    <h2 className="text-lg font-bold" style={{ color: colors.gray800 }}>FORMATO DE FINALIZACIÓN</h2>
                    <p className="text-[14px]" style={{ color: colors.gray600 }}>Orden #{data.ticket_id || data.subscriberNumber}</p>
                </div>

                {/* RIGHT: METADATA (Date, Technician) */}
                <div className="text-right text-[12px]">
                    {/* Creation Date */}
                    {data.createdAt && (
                        <p className="font-medium mt-0.5" style={{ color: colors.gray600 }}>
                            Hora Asignada: <span className="font-bold">{new Date(data.createdAt).toLocaleDateString()} {new Date(data.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    )}
                    {/* Completion Date replacing Last Update Date */}
                    {data.completionDate && (
                        <p className="font-medium mt-0.5" style={{ color: colors.gray600 }}>
                            Fecha de Finalización: <span className="font-bold">{new Date(data.completionDate).toLocaleDateString()} {new Date(data.completionDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    )}
                    {/* Technician Name in Header */}
                    {data.technicianName && (
                        <p className="text-[14px] font-medium mt-0.5" style={{ color: colors.primary }}>
                            Técnico: <span className="font-bold">{data.technicianName}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* SUBSCRIBER INFO, TECHNICAL DETAILS & MATERIALS - CUSTOM COLUMN LAYOUT */}
            <div className="grid mb-3" style={{ gridTemplateColumns: '22% 36% 42%', gap: '0.75rem' }}>
                {/* SUBSCRIBER INFO - 22% */}
                <div>
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Datos del Abonado</h3>
                    <div className="space-y-1 text-[14px]">
                        <div>
                            <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Abonado:</span>
                            <span className="font-medium text-[12px] break-words">{data.subscriberName}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Nº Abonado:</span>
                            <span className="font-medium text-[12px]">{data.subscriberNumber}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Dirección:</span>
                            <span className="font-medium text-[12px] leading-tight break-words">{data.address?.substring(0, 50)}{data.address?.length > 50 ? '...' : ''}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Teléfonos:</span>
                            <span className="font-medium text-[12px] break-words">{data.phones}</span>
                        </div>
                    </div>
                </div>

                {/* TECHNICAL DETAILS - 28% */}
                <div>
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Detalles Técnicos</h3>
                    <div className="space-y-1 text-[14px]">
                        <div className="flex">
                            <div className="mr-4">
                                <span className="font-semibold block text-[12px] mb-0.5" style={{ color: colors.gray600 }}>Tipo de Orden:</span>
                                <div className="uppercase font-medium px-1.5 py-0.5 rounded text-[12px] inline-block" style={{ backgroundColor: colors.gray100 }}>
                                    {data.type}
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold block text-[12px] mb-0.5" style={{ color: colors.gray600 }}>Estado:</span>
                                <div className="uppercase font-medium px-1.5 py-0.5 rounded text-[12px] inline-block" style={{
                                    backgroundColor: data.status === 'completed_special' ? '#ccfbf1' : '#dcfce7',
                                    color: data.status === 'completed_special' ? '#115e59' : '#166534',
                                    border: `1px solid ${data.status === 'completed_special' ? '#99f6e4' : '#bbf7d0'}`
                                }}>
                                    {data.status === 'completed_special' ? 'COMPLETADA ESPECIAL' : 'COMPLETADA'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Nodo:</span>
                                <span className="font-medium text-[12px] break-words">{data.node || 'N/A'}</span>
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Color Etiqueta:</span>
                                <span className="font-medium text-[12px] capitalize">
                                    {data.etiqueta?.color === 'verde' ? '🟢 Verde' :
                                        data.etiqueta?.color === 'rojo' ? '🔴 Rojo' :
                                            data.etiqueta?.color === 'azul' ? '🔵 Azul' :
                                                data.etiqueta?.color || 'N/A'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Nº Etiqueta:</span>
                                <span className="font-medium text-[12px]">{data.etiqueta?.numero || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold block text-[12px]" style={{ color: colors.gray600 }}>Servicios / Trabajo Realizado:</span>
                            <span className="font-medium text-[12px] break-words">{data.servicesToInstall || 'N/A'}</span>
                        </div>
                        {/* Compact Technical Fields */}
                        <div className="grid grid-cols-3 gap-y-1 gap-x-2 mt-1">
                            <div>
                                <span className="font-semibold block text-[11px]" style={{ color: colors.gray600 }}>Pot. Nap:</span>
                                <span className="font-medium text-[12px]">{data.powerNap || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold block text-[11px]" style={{ color: colors.gray600 }}>Pot. Roseta:</span>
                                <span className="font-medium text-[12px]">{data.powerRoseta || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold block text-[11px]" style={{ color: colors.gray600 }}>Serial Nap:</span>
                                <span className="font-medium text-[12px]">{data.serialNap || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold block text-[11px]" style={{ color: colors.gray600 }}>Puerto Usado:</span>
                                <span className="font-medium text-[12px]">{data.usedPort || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold block text-[11px]" style={{ color: colors.gray600 }}>Ptos. Restantes:</span>
                                <span className="font-medium text-[12px]">{data.remainingPorts !== undefined ? data.remainingPorts : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MATERIALS USED - 42% - CODE AND QUANTITY ONLY */}
                <div className="pr-4">
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Materiales Utilizados</h3>
                    {(usedMaterials.length > 0 || (data.type?.toLowerCase() === 'recuperacion' && (data.equipmentRecovered?.ontId || data.equipmentRecovered?.serialNumber))) ? (
                        <div className="grid grid-cols-2 gap-1.5">
                            {usedMaterials.map((mat: any, idx) => (
                                <div key={idx} className="flex flex-col px-2 py-1 rounded text-[11px]" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold break-words" style={{ color: mat.item ? colors.gray700 : colors.gray400 }}>
                                            {mat.item?.code ?? '(Material eliminado)'}
                                        </span>
                                        <span className="font-bold ml-2" style={{ color: colors.gray800 }}>×{mat.quantity}</span>
                                    </div>
                                    {/* Mostrar seriales si existen (para equipos) */}
                                    {mat.instanceDetails && mat.instanceDetails.length > 0 && (
                                        <div className="mt-0.5 flex flex-wrap gap-1">
                                            {mat.instanceDetails.map((inst: any, i: number) => (
                                                <span key={i} className="text-[12px] font-mono font-semibold" style={{ color: colors.gray700 }}>
                                                    SN:{inst.uniqueId}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {data.type?.toLowerCase() === 'recuperacion' && (data.equipmentRecovered?.ontId || data.equipmentRecovered?.serialNumber) && (
                                <div className="flex flex-col px-2 py-1 rounded text-[11px]" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold break-words" style={{ color: colors.gray700 }}>
                                            {data.equipmentRecovered.model ? `ONT ${data.equipmentRecovered.model}` : 'ONT Recuperada'} ({data.equipmentRecovered.ontId || 'Sin ID'})
                                        </span>
                                        <span className="font-bold ml-2" style={{ color: colors.gray800 }}>×1</span>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap gap-1 items-center justify-between">
                                        <span className="text-[12px] font-mono font-semibold" style={{ color: colors.gray700 }}>
                                            SN:{data.equipmentRecovered.serialNumber || 'No registrado'}
                                        </span>
                                        {data.equipmentRecovered.condition && (
                                            <span className="text-[10px] uppercase font-bold px-1 py-0.5 rounded" style={{
                                                backgroundColor: data.equipmentRecovered.condition === 'good' ? '#dcfce7' : data.equipmentRecovered.condition === 'damaged' ? '#fee2e2' : '#fef9c3',
                                                color: data.equipmentRecovered.condition === 'good' ? '#166534' : data.equipmentRecovered.condition === 'damaged' ? '#991b1b' : '#854d0e',
                                            }}>
                                                {data.equipmentRecovered.condition === 'good' ? 'Bueno' : data.equipmentRecovered.condition === 'damaged' ? 'Dañado' : data.equipmentRecovered.condition === 'defective' ? 'Defectuoso' : data.equipmentRecovered.condition}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="italic text-[11px] py-1" style={{ color: colors.gray500 }}>No se registraron materiales.</p>
                    )}
                </div>
            </div>

            {/* SPEEDTEST, INSTALLER LOG & SIGNATURE - SIDE BY SIDE */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                {/* SPEEDTEST - 1 COLUMN */}
                <div>
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Prueba de Velocidad</h3>
                    {data.internetTest ? (
                        <div className="p-2 rounded" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase" style={{ color: colors.gray500 }}>Descarga</span>
                                    <span className="text-[12px] font-bold" style={{ color: colors.green600 }}>{data.internetTest.downloadSpeed || 0} <span className="text-[8px]" style={{ color: colors.gray400 }}>Mbps</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase" style={{ color: colors.gray500 }}>Carga</span>
                                    <span className="text-[12px] font-bold" style={{ color: colors.blue600 }}>{data.internetTest.uploadSpeed || 0} <span className="text-[8px]" style={{ color: colors.gray400 }}>Mbps</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase" style={{ color: colors.gray500 }}>Ping</span>
                                    <span className="text-[12px] font-bold" style={{ color: colors.gray700 }}>{data.internetTest.ping || 0} <span className="text-[8px]" style={{ color: colors.gray400 }}>ms</span></span>
                                </div>
                                <div className="pt-1 text-[10px]" style={{ borderTop: `1px solid ${colors.gray200}` }}>
                                    <span style={{ color: colors.gray500 }}>Frecuencia:</span> <span className="font-medium" style={{ color: colors.gray700 }}>{data.internetTest.frecuency || 'N/A'}</span>
                                    <span className="mx-1" style={{ color: colors.gray300 }}>•</span>
                                    <span style={{ color: colors.gray500 }}>Señal:</span> <span className="font-medium" style={{ color: colors.gray700 }}>{data.internetTest.wifiSSID || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 rounded text-center" style={{ backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                            <p className="text-[12px] italic py-4" style={{ color: colors.gray500 }}>No se realizó prueba de velocidad.</p>
                        </div>
                    )}
                </div>

                {/* INSTALLER LOG - 1 COLUMN */}
                <div>
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Bitácora</h3>
                    {data.installerLog && data.installerLog.length > 0 ? (() => {
                        const lastLog = data.installerLog[data.installerLog.length - 1];
                        return (
                            <div className="p-2 rounded" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                <p className="text-[12px] leading-relaxed" style={{ color: colors.gray700 }}>{lastLog.log}</p>
                                <div className="flex justify-end mt-1.5">
                                    <span className="text-[11px]" style={{ color: colors.gray500 }}>
                                        {new Date(lastLog.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} {new Date(lastLog.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="p-2 rounded text-center" style={{ backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                            <p className="text-[12px] italic py-4" style={{ color: colors.gray500 }}>Sin bitácora registrada.</p>
                        </div>
                    )}
                </div>

                {/* SIGNATURE - 1 COLUMN (RIGHT) */}
                <div className="pr-4">
                    <h3 className="text-[14px] font-bold uppercase mb-2 pb-0.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.gray200}` }}>Firma del Cliente</h3>
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
                        <p className="text-[12px] text-center" style={{ color: colors.gray400 }}>Acepto conforme el trabajo realizado</p>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-4 pt-2 text-center text-[12px]" style={{ borderTop: `1px solid ${colors.gray100}`, color: colors.gray400 }}>
                <p>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()} • ENLARED Web Platform</p>
            </div>
        </div>
    );
});

OrderCompletionCertificate.displayName = 'OrderCompletionCertificate';
