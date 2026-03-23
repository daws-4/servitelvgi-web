import { ImageResponse } from 'next/og';
import { getOrderById } from '@/lib/orderService';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; // Node runtime required because Mongoose doesn't support Edge

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const order = await getOrderById(id, true) as any;

        if (!order) {
            return new Response('Order not found', { status: 404 });
        }

        // Filter only materials with quantity > 0
        const usedMaterials = order.materialsUsed?.filter((m: any) => m.quantity > 0) || [];

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

        const technicianName = order.assignedTo?.leader
            ? `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname}`
            : `Cuadrilla ${order.assignedTo?.number || ''}`;

        // Get absolute URL for logo
        const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.enlaredve.com';
        const logoUrl = `${hostUrl}/netuno_logo.png`;

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '800px', // Matches HTML exact size
                        height: '1100px',
                        backgroundColor: colors.white,
                        color: colors.black,
                        padding: '16px',
                        fontFamily: 'sans-serif',
                        fontSize: '12px'
                    }}
                >
                    {/* HEADER */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: '8px',
                            marginBottom: '12px',
                            borderBottom: `2px solid ${colors.primary}`,
                        }}
                    >
                        {/* LEFT: LOGO */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src={logoUrl}
                                width={126}
                                height={126}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>

                        {/* CENTER: TITLE & ORDER INFO */}
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', position: 'absolute', left: '337px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.gray800, margin: 0, marginBottom: '4px' }}>FORMATO DE FINALIZACIÓN</h2>
                            <p style={{ fontSize: '14px', color: colors.gray600, margin: 0 }}>Orden #{order.ticket_id || order.subscriberNumber}</p>
                        </div>

                        {/* RIGHT: METADATA (Date, Technician) */}
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end', fontSize: '12px' }}>
                            {order.createdAt && (
                                <p style={{ fontWeight: '500', color: colors.gray600, margin: '2px 0' }}>
                                    Hora Asignada: <span style={{ fontWeight: 'bold' }}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            )}
                            {order.updatedAt && (
                                <p style={{ fontWeight: '500', color: colors.gray600, margin: '2px 0' }}>
                                    Fecha de Finalización: <span style={{ fontWeight: 'bold' }}>{new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            )}
                            {technicianName && (
                                <p style={{ fontSize: '14px', fontWeight: '500', color: colors.primary, margin: '2px 0' }}>
                                    Técnico: <span style={{ fontWeight: 'bold' }}>{technicianName}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* SUBSCRIBER INFO, TECHNICAL DETAILS & MATERIALS - CUSTOM COLUMN LAYOUT */}
                    <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '12px', gap: '12px' }}>
                        
                        {/* SUBSCRIBER INFO - 22% -> 176px */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '22%' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Datos del Abonado</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', gap: '4px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Abonado:</span>
                                    <span style={{ fontWeight: '500' }}>{order.subscriberName}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Nº Abonado:</span>
                                    <span style={{ fontWeight: '500' }}>{order.subscriberNumber}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Dirección:</span>
                                    <span style={{ fontWeight: '500', lineHeight: 1.2 }}>{order.address?.substring(0, 50)}{order.address?.length > 50 ? '...' : ''}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Teléfonos:</span>
                                    <span style={{ fontWeight: '500' }}>{order.phones || order.subscriberNumber}</span>
                                </div>
                            </div>
                        </div>

                        {/* TECHNICAL DETAILS - 36% -> 288px */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '36%' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Detalles Técnicos</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px', marginBottom: '2px' }}>Tipo de Orden:</span>
                                        <div style={{ textTransform: 'uppercase', fontWeight: '500', padding: '2px 6px', borderRadius: '4px', backgroundColor: colors.gray100, fontSize: '12px', display: 'flex' }}>
                                            {order.type}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px', marginBottom: '2px' }}>Estado:</span>
                                        <div style={{ 
                                            textTransform: 'uppercase', fontWeight: '500', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', display: 'flex',
                                            backgroundColor: order.status === 'completed_special' ? '#ccfbf1' : '#dcfce7',
                                            color: order.status === 'completed_special' ? '#115e59' : '#166534',
                                            border: `1px solid ${order.status === 'completed_special' ? '#99f6e4' : '#bbf7d0'}`
                                        }}>
                                            {order.status === 'completed_special' ? 'COMPLETADA ESPECIAL' : 'COMPLETADA'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Nodo:</span>
                                        <span style={{ fontWeight: '500' }}>{order.node || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Color Etiqueta:</span>
                                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                                            {order.etiqueta?.color === 'verde' ? 'Verde' :
                                             order.etiqueta?.color === 'rojo' ? 'Rojo' :
                                             order.etiqueta?.color === 'azul' ? 'Azul' :
                                             order.etiqueta?.color || 'N/A'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Nº Etiqueta:</span>
                                        <span style={{ fontWeight: '500' }}>{order.etiqueta?.numero || 'N/A'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '12px' }}>Servicios / Trabajo:</span>
                                    <span style={{ fontWeight: '500' }}>{order.servicesToInstall || 'N/A'}</span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '11px' }}>Pot. Nap:</span>
                                        <span style={{ fontWeight: '500', fontSize: '12px' }}>{order.powerNap || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '11px' }}>Pot. Roseta:</span>
                                        <span style={{ fontWeight: '500', fontSize: '12px' }}>{order.powerRoseta || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '11px' }}>Serial Nap:</span>
                                        <span style={{ fontWeight: '500', fontSize: '12px' }}>{order.serialNap || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '11px' }}>Pto Usado:</span>
                                        <span style={{ fontWeight: '500', fontSize: '12px' }}>{order.usedPort || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MATERIALS USED - 42% -> 336px */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '42%' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Materiales Utilizados</h3>
                            {usedMaterials.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {usedMaterials.map((mat: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px', borderRadius: '4px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}`, fontSize: '11px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <span style={{ fontWeight: '600', color: mat.item ? colors.gray700 : colors.gray400 }}>
                                                    {mat.item?.code ?? '(Material eliminado)'}
                                                </span>
                                                <span style={{ fontWeight: 'bold', marginLeft: '8px', color: colors.gray800 }}>×{mat.quantity}</span>
                                            </div>
                                            {mat.instanceDetails && mat.instanceDetails.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                                    {mat.instanceDetails.map((inst: any, i: number) => (
                                                        <span key={i} style={{ fontSize: '12px', fontWeight: '600', color: colors.gray700 }}>
                                                            SN:{inst.uniqueId}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontStyle: 'italic', fontSize: '11px', padding: '4px 0', margin: 0, color: colors.gray500 }}>No se registraron materiales.</p>
                            )}
                        </div>
                    </div>

                    {/* SPEEDTEST, INSTALLER LOG & SIGNATURE - SIDE BY SIDE */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginBottom: '12px' }}>
                        
                        {/* SPEEDTEST - 33% */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Prueba de Velocidad</h3>
                            {order.internetTest ? (
                                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px', borderRadius: '4px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500 }}>Descarga</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.green600 }}>{order.internetTest.downloadSpeed || 0}</span>
                                                <span style={{ fontSize: '8px', color: colors.gray400, marginLeft: '4px' }}>Mbps</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500 }}>Carga</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.blue600 }}>{order.internetTest.uploadSpeed || 0}</span>
                                                <span style={{ fontSize: '8px', color: colors.gray400, marginLeft: '4px' }}>Mbps</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500 }}>Ping</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.gray700 }}>{order.internetTest.ping || 0}</span>
                                                <span style={{ fontSize: '8px', color: colors.gray400, marginLeft: '4px' }}>ms</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'row', paddingTop: '4px', marginTop: '4px', borderTop: `1px solid ${colors.gray200}`, fontSize: '10px' }}>
                                            <span style={{ color: colors.gray500, marginRight: '4px' }}>Señal:</span>
                                            <span style={{ fontWeight: '500', color: colors.gray700 }}>{order.internetTest.wifiSSID || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', padding: '8px', borderRadius: '4px', textAlign: 'center', backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                                    <p style={{ fontSize: '12px', fontStyle: 'italic', padding: '16px 0', margin: 0, color: colors.gray500 }}>No se realizó prueba.</p>
                                </div>
                            )}
                        </div>

                        {/* LOG - 33% */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Bitácora</h3>
                            <div style={{ display: 'flex', padding: '8px', borderRadius: '4px', textAlign: 'center', backgroundColor: colors.gray50, border: `1px dashed ${colors.gray300}` }}>
                                <p style={{ fontSize: '12px', fontStyle: 'italic', padding: '16px 0', margin: 0, color: colors.gray500 }}>{order.installerLog?.[0]?.log ? order.installerLog[order.installerLog.length - 1].log : 'Sin bitácora.'}</p>
                            </div>
                        </div>

                        {/* SIGNATURE - 33% */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `1px solid ${colors.gray200}`, paddingBottom: '2px', marginBottom: '8px', margin: 0 }}>Firma del Cliente</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {order.customerSignature ? (
                                    <div style={{ display: 'flex', marginBottom: '4px', paddingBottom: '4px', width: '100%', borderBottom: `1px solid ${colors.gray300}`, justifyContent: 'center' }}>
                                        <img src={order.customerSignature} height={64} style={{ objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', height: '64px', marginBottom: '4px', width: '100%', borderBottom: `1px solid ${colors.gray300}` }}></div>
                                )}
                                <p style={{ fontSize: '12px', textAlign: 'center', color: colors.gray400, margin: 0 }}>Acepto conforme</p>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div style={{ display: 'flex', marginTop: '16px', paddingTop: '8px', justifyContent: 'center', borderTop: `1px solid ${colors.gray100}`, fontSize: '12px', color: colors.gray400 }}>
                        <p style={{ margin: 0 }}>Generado automáticamente el {new Date().toLocaleDateString()} • ENLARED Web Platform API</p>
                    </div>
                </div>
            ),
            {
                width: 800,
                height: 520, // Taller enough to fit everything optimally
            }
        );
    } catch (e: any) {
        console.error('Error generating image:', e);
        return new Response(`Failed to generate the image: ${e.message}`, {
            status: 500,
        });
    }
}
