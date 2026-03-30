import { ImageResponse } from 'next/og';
import { getStatusConfig } from "@/lib/orderConstants";

export async function generateCertificateArrayBuffer(order: any): Promise<ArrayBuffer> {
    const usedMaterials = order.materialsUsed?.filter((m: any) => m.quantity > 0) || [];

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

    const technicianName = order.assignedTo?.leader
        ? `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname}`
        : `Cuadrilla ${order.assignedTo?.number || ''}`;

    // Load Logo as Base64 to strictly bypass any Satori local networking bugs
    let logoData = '';
    try {
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'public', 'netuno_logo.png');
        logoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    } catch(e) {}

    // Split materials manually for 2 columns to avoid Satori flexWrap bugs
    const half = Math.ceil(usedMaterials.length / 2);
    const firstHalfMaterials = usedMaterials.slice(0, half);
    const secondHalfMaterials = usedMaterials.slice(half);

    // Format services to ensure spaces
    let servicesFormatted = order.servicesToInstall || 'N/A';
    if (Array.isArray(servicesFormatted)) {
        servicesFormatted = servicesFormatted.join(', ');
    }
    // ensure spaces after words by regex if squished
    if (typeof servicesFormatted === 'string') {
        servicesFormatted = servicesFormatted
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([0-9])([A-Za-z])/g, '$1 $2')
            .replace(/N°/g, 'N° ') // fix specific DB artifact
            .replace(/N²/g, 'N° ');
    }

    const response = new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '1200px',
                    height: '800px',
                    backgroundColor: colors.white,
                    color: colors.black,
                    padding: '30px 40px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '20px',
                        marginBottom: '20px',
                        borderBottom: `4px solid ${colors.primary}`,
                        width: '1120px',
                    }}
                >
                    {/* LEFT: LOGO */}
                    <div style={{ display: 'flex', width: '300px', justifyContent: 'flex-start' }}>
                        {logoData && (
                            <img
                                src={logoData}
                                width={200}
                                style={{ objectFit: 'contain' }}
                            />
                        )}
                    </div>

                    {/* CENTER: TITLE & ORDER INFO */}
                    <div style={{ display: 'flex', width: '500px', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.gray800, margin: 0, marginBottom: '8px' }}>FORMATO DE FINALIZACIÓN</h2>
                        <p style={{ fontSize: '24px', color: colors.gray600, margin: 0 }}>Orden #{order.ticket_id || order.subscriberNumber}</p>
                    </div>

                    {/* RIGHT: METADATA */}
                    <div style={{ display: 'flex', width: '320px', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {order.createdAt && (
                            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '4px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '500', color: colors.gray600, marginRight: '6px' }}>Hora Asignada:</span>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gray600 }}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                        {order.updatedAt && (
                            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '500', color: colors.gray600, marginRight: '6px' }}>Fecha de Finalización:</span>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gray600 }}>{new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <span style={{ fontSize: '20px', fontWeight: '500', color: colors.primary, marginRight: '6px' }}>Técnico:</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>{technicianName}</span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE ROW: SUBSCRIBER INFO, TECHNICAL DETAILS & MATERIALS */}
                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '20px', minHeight: '380px', width: '1120px' }}>
                    
                    {/* SUBSCRIBER */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '280px', paddingRight: '20px', flexShrink: 0 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>DATOS DEL ABONADO</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '16px', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Abonado:</span>
                                <span style={{ fontWeight: '500', fontSize: '18px', textTransform: 'uppercase' }}>{order.subscriberName}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Nº Abonado:</span>
                                <span style={{ fontWeight: '500', fontSize: '18px' }}>{order.subscriberNumber}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Dirección:</span>
                                <span style={{ fontWeight: '500', fontSize: '16px', lineHeight: 1.3 }}>{order.address?.substring(0, 100)}{order.address?.length > 100 ? '...' : ''}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Teléfonos:</span>
                                <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.phones || order.subscriberNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* TECHNICAL */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '380px', paddingRight: '20px', flexShrink: 0 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>DETALLES TÉCNICOS</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
                            
                            {/* Type & Status */}
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '160px' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, marginBottom: '4px' }}>Tipo de Orden:</span>
                                    <div style={{ textTransform: 'uppercase', fontWeight: '500', padding: '4px 12px', borderRadius: '4px', backgroundColor: colors.gray100, display: 'flex' }}>
                                        {order.type}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '180px' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, marginBottom: '4px' }}>Estado:</span>
                                    <div style={{
                                        textTransform: 'uppercase', fontWeight: '500', padding: '4px 12px', borderRadius: '4px', display: 'flex',
                                        backgroundColor: getStatusConfig(order.status).hexBgColor,
                                        color: getStatusConfig(order.status).hexColor,
                                        border: `1px solid ${getStatusConfig(order.status).hexColor}40` // 40 hex is 25% opacity
                                    }}>
                                        {getStatusConfig(order.status).label.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tags row */}
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '160px' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Nodo:</span>
                                    <span style={{ fontWeight: '500', fontSize: '18px', overflow: 'hidden' }}>{order.node || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100px' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Color Etiq:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                                        {order.etiqueta?.color && (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '6px', marginRight: '6px', backgroundColor: order.etiqueta.color === 'verde' ? '#10b981' : order.etiqueta.color === 'rojo' ? '#ef4444' : order.etiqueta.color === 'azul' ? '#3b82f6' : 'transparent' }}></div>
                                        )}
                                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                                            {order.etiqueta?.color === 'verde' ? 'Verde' : order.etiqueta?.color === 'rojo' ? 'Rojo' : order.etiqueta?.color === 'azul' ? 'Azul' : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '90px' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Nº Etiq:</span>
                                    <span style={{ fontWeight: '500' }}>{order.etiqueta?.numero || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Servicios / Trabajo Realizado:</span>
                                <span style={{ fontWeight: '500', lineHeight: 1.3 }}>{servicesFormatted}</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '4px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '14px' }}>Pot. Nap:</span>
                                    <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.powerNap || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '14px' }}>Pot. Roseta:</span>
                                    <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.powerRoseta || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '14px' }}>Serial Nap:</span>
                                    <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.serialNap || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '14px' }}>Puerto:</span>
                                    <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.usedPort || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MATERIALS */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '460px', flexShrink: 0 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>MATERIALES UTILIZADOS</h3>
                        {usedMaterials.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                {/* COLUMN 1 */}
                                <div style={{ display: 'flex', flexDirection: 'column', width: '226px', gap: '8px' }}>
                                    {firstHalfMaterials.map((mat: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                            <div style={{ display: 'flex', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: mat.item ? colors.gray700 : colors.gray400, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {mat.item?.code ?? mat.item ?? '(Borrado)'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', width: '30px', justifyContent: 'flex-end', flexShrink: 0 }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gray800 }}>×{mat.quantity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* COLUMN 2 */}
                                <div style={{ display: 'flex', flexDirection: 'column', width: '226px', gap: '8px' }}>
                                    {secondHalfMaterials.map((mat: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                            <div style={{ display: 'flex', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: mat.item ? colors.gray700 : colors.gray400, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {mat.item?.code ?? mat.item ?? '(Borrado)'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', width: '30px', justifyContent: 'flex-end', flexShrink: 0 }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gray800 }}>×{mat.quantity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontStyle: 'italic', fontSize: '16px', color: colors.gray500, margin: 0 }}>No se registraron materiales.</p>
                        )}
                    </div>
                </div>

                {/* BOTTOM ROW: SPEEDTEST, LOG, SIGNATURE */}
                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 'auto', gap: '20px' }}>
                    
                    {/* SPEEDTEST */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '360px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>PRUEBA DE VELOCIDAD</h3>
                        {order.internetTest ? (
                            <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', borderRadius: '8px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
                                    <span style={{ fontSize: '14px', textTransform: 'uppercase', color: colors.gray500 }}>DESCARGA</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.green600 }}>{order.internetTest.downloadSpeed || 0}</span>
                                        <span style={{ fontSize: '14px', color: colors.gray400, marginLeft: '6px' }}>Mbps</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
                                    <span style={{ fontSize: '14px', textTransform: 'uppercase', color: colors.gray500 }}>CARGA</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.blue600 }}>{order.internetTest.uploadSpeed || 0}</span>
                                        <span style={{ fontSize: '14px', color: colors.gray400, marginLeft: '6px' }}>Mbps</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontSize: '14px', textTransform: 'uppercase', color: colors.gray500 }}>PING</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.gray700 }}>{order.internetTest.ping || 0}</span>
                                        <span style={{ fontSize: '14px', color: colors.gray400, marginLeft: '6px' }}>ms</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                                <p style={{ fontSize: '16px', fontStyle: 'italic', margin: 0, color: colors.gray500 }}>No se realizó prueba.</p>
                            </div>
                        )}
                    </div>

                    {/* LOG */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '400px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>BITÁCORA</h3>
                        <div style={{ display: 'flex', padding: '16px', borderRadius: '8px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}`, minHeight: '100px' }}>
                            <p style={{ fontSize: '16px', color: colors.gray700, margin: 0 }}>{order.installerLog?.[0]?.log ? order.installerLog[order.installerLog.length - 1].log : order.installerLog?.log || 'Sin bitácora.'}</p>
                        </div>
                    </div>

                    {/* SIGNATURE */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '320px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>FIRMA DEL CLIENTE</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {order.customerSignature ? (
                                <div style={{ display: 'flex', paddingBottom: '8px', marginBottom: '8px', width: '100%', borderBottom: `1px solid ${colors.gray300}`, justifyContent: 'center' }}>
                                    <img src={order.customerSignature} height={90} style={{ objectFit: 'contain' }} alt="Firma" />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', height: '90px', marginBottom: '8px', width: '100%', borderBottom: `1px solid ${colors.gray300}` }}></div>
                            )}
                            <p style={{ fontSize: '16px', textAlign: 'center', color: colors.gray400, margin: 0 }}>Acepto conforme el trabajo realizado</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{ display: 'flex', marginTop: '20px', paddingTop: '16px', justifyContent: 'center', color: colors.gray400 }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>Generado automáticamente el {new Date().toLocaleDateString()} • ENLARED Web Platform API</p>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 900,
        }
    );


    return await response.arrayBuffer();
}
