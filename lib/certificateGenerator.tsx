import { ImageResponse } from 'next/og';

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

    const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.enlaredve.com';
    const logoUrl = `${hostUrl}/netuno_logo.png`;

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
                    padding: '40px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '20px',
                        marginBottom: '20px',
                        borderBottom: `4px solid ${colors.primary}`,
                    }}
                >
                    {/* LOGO */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '250px' }}>
                        <img
                            src={logoUrl}
                            width={220}
                            style={{ objectFit: 'contain' }}
                            alt="Netuno"
                        />
                    </div>

                    {/* CENTER: TITLE & ORDER INFO */}
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.gray800, margin: 0, marginBottom: '8px' }}>FORMATO DE FINALIZACIÓN</h2>
                        <p style={{ fontSize: '24px', color: colors.gray600, margin: 0 }}>Orden #{order.ticket_id || order.subscriberNumber}</p>
                    </div>

                    {/* RIGHT: METADATA */}
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end', width: '250px' }}>
                        {order.createdAt && (
                            <p style={{ fontSize: '16px', fontWeight: '500', color: colors.gray600, margin: '4px 0' }}>
                                Hora Asignada: <span style={{ fontWeight: 'bold' }}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                        )}
                        {order.updatedAt && (
                            <p style={{ fontSize: '16px', fontWeight: '500', color: colors.gray600, margin: '4px 0' }}>
                                Fecha de Finalización: <span style={{ fontWeight: 'bold' }}>{new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                        )}
                        {technicianName && (
                            <p style={{ fontSize: '20px', fontWeight: '500', color: colors.primary, marginTop: '8px', marginBottom: '0px' }}>
                                Técnico: <span style={{ fontWeight: 'bold' }}>{technicianName}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* MIDDLE ROW: SUBSCRIBER INFO, TECHNICAL DETAILS & MATERIALS */}
                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '20px', minHeight: '350px' }}>
                    
                    {/* SUBSCRIBER - 25% */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '280px', paddingRight: '20px' }}>
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

                    {/* TECHNICAL - 35% */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '380px', paddingRight: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>DETALLES TÉCNICOS</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, marginBottom: '4px' }}>Tipo de Orden:</span>
                                    <div style={{ textTransform: 'uppercase', fontWeight: '500', padding: '4px 12px', borderRadius: '4px', backgroundColor: colors.gray100, display: 'flex' }}>
                                        {order.type}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600, marginBottom: '4px' }}>Estado:</span>
                                    <div style={{
                                        textTransform: 'uppercase', fontWeight: '500', padding: '4px 12px', borderRadius: '4px', display: 'flex',
                                        backgroundColor: order.status === 'completed_special' ? '#ccfbf1' : '#dcfce7',
                                        color: order.status === 'completed_special' ? '#115e59' : '#166534',
                                        border: `1px solid ${order.status === 'completed_special' ? '#99f6e4' : '#bbf7d0'}`
                                    }}>
                                        {order.status === 'completed_special' ? 'COMPLETADA ESPECIAL' : 'COMPLETADA'}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Nodo:</span>
                                    <span style={{ fontWeight: '500', fontSize: '18px' }}>{order.node || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Color Etiqueta:</span>
                                    <span style={{ fontWeight: '500', textTransform: 'capitalize', display: 'flex', alignItems: 'center' }}>
                                        {order.etiqueta?.color && (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '6px', marginRight: '6px', backgroundColor: order.etiqueta.color === 'verde' ? '#10b981' : order.etiqueta.color === 'rojo' ? '#ef4444' : order.etiqueta.color === 'azul' ? '#3b82f6' : 'transparent' }}></div>
                                        )}
                                        {order.etiqueta?.color === 'verde' ? 'Verde' : order.etiqueta?.color === 'rojo' ? 'Rojo' : order.etiqueta?.color === 'azul' ? 'Azul' : 'N/A'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: colors.gray600 }}>Nº Etiqueta:</span>
                                    <span style={{ fontWeight: '500' }}>{order.etiqueta?.numero || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: colors.gray600 }}>Servicios / Trabajo Realizado:</span>
                                <span style={{ fontWeight: '500' }}>{Array.isArray(order.servicesToInstall) ? order.servicesToInstall.join(', ') : order.servicesToInstall || 'N/A'}</span>
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
                                    <span style={{ fontWeight: '600', color: colors.gray600, fontSize: '14px' }}>Puerto Usado:</span>
                                    <span style={{ fontWeight: '500', fontSize: '16px' }}>{order.usedPort || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MATERIALS - 40% (2 column grid layout) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '460px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, borderBottom: `2px solid ${colors.gray200}`, paddingBottom: '4px', marginBottom: '16px', margin: 0 }}>MATERIALES UTILIZADOS</h3>
                        {usedMaterials.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
                                {usedMaterials.map((mat: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '226px', padding: '10px', borderRadius: '8px', backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: mat.item ? colors.gray700 : colors.gray400, flex: 1 }}>
                                                {mat.item?.code ?? mat.item ?? '(Material eliminado)'}
                                            </span>
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gray800 }}>×{mat.quantity}</span>
                                        </div>
                                    </div>
                                ))}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', textTransform: 'uppercase', color: colors.gray500 }}>DESCARGA</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.green600 }}>{order.internetTest.downloadSpeed || 0}</span>
                                        <span style={{ fontSize: '14px', color: colors.gray400, marginLeft: '6px' }}>Mbps</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', textTransform: 'uppercase', color: colors.gray500 }}>CARGA</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.blue600 }}>{order.internetTest.uploadSpeed || 0}</span>
                                        <span style={{ fontSize: '14px', color: colors.gray400, marginLeft: '6px' }}>Mbps</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            height: 750,
        }
    );

    return await response.arrayBuffer();
}
