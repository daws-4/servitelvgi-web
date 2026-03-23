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

        const colors = {
            primary: '#3e78b2',
            white: '#ffffff',
            gray100: '#f3f4f6',
            gray200: '#e5e7eb',
            gray600: '#4b5563',
            gray700: '#374151',
            gray800: '#1f2937',
        };

        const technicianName = order.assignedTo?.leader
            ? `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname}`
            : `Cuadrilla ${order.assignedTo?.number || ''}`;

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        backgroundColor: colors.white,
                        padding: '40px',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: `4px solid ${colors.primary}`,
                            paddingBottom: '20px',
                            marginBottom: '30px',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{ fontSize: '36px', color: colors.gray800, margin: 0, fontWeight: 'bold' }}>
                                FORMATO DE FINALIZACIÓN
                            </h1>
                            <p style={{ fontSize: '24px', color: colors.gray600, margin: '10px 0 0' }}>
                                Orden #{order.ticket_id || order.subscriberNumber}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end' }}>
                            <p style={{ fontSize: '20px', color: colors.gray600, margin: 0 }}>
                                Fecha: {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                            </p>
                            <p style={{ fontSize: '20px', color: colors.primary, marginTop: '10px', fontWeight: 'bold' }}>
                                Técnico: {technicianName}
                            </p>
                        </div>
                    </div>

                    {/* Content Columns */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', flex: 1 }}>
                        
                        {/* Left Column: Subscriber & Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '20px', borderRight: `2px solid ${colors.gray200}` }}>
                            <h2 style={{ fontSize: '24px', color: colors.primary, marginBottom: '20px' }}>Datos del Abonado</h2>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Suscritor:</strong> {order.subscriberName}</p>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Dirección:</strong> {order.address}</p>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Nº Abonado:</strong> {order.subscriberNumber}</p>

                            <h2 style={{ fontSize: '24px', color: colors.primary, marginTop: '40px', marginBottom: '20px' }}>Detalles Técnicos</h2>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Tipo:</strong> {order.type?.toUpperCase()}</p>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Estado:</strong> {order.status?.toUpperCase()}</p>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Nodo:</strong> {order.node || 'N/A'}</p>
                            <p style={{ fontSize: '20px', margin: '5px 0' }}><strong>Servicios:</strong> {Array.isArray(order.servicesToInstall) ? order.servicesToInstall.join(', ') : order.servicesToInstall || 'N/A'}</p>
                        </div>

                        {/* Middle Column: Materials */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h2 style={{ fontSize: '24px', color: colors.primary, marginBottom: '20px' }}>Materiales Utilizados</h2>
                            {order.materialsUsed && order.materialsUsed.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {order.materialsUsed.map((mat: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: colors.gray100, borderRadius: '8px' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{mat.item?.code || 'Material'}</span>
                                            <span style={{ fontSize: '18px', color: colors.primary, fontWeight: 'bold' }}>×{mat.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '20px', fontStyle: 'italic', color: colors.gray600 }}>Sin materiales.</p>
                            )}

                            {/* SpeedTest */}
                            {order.internetTest && (
                                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
                                    <h2 style={{ fontSize: '24px', color: colors.primary, marginBottom: '20px' }}>Velocidad</h2>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '8px', flex: 1 }}>
                                            <span style={{ fontSize: '16px', color: colors.gray600 }}>Descarga</span>
                                            <strong style={{ fontSize: '24px', color: '#0284c7' }}>{order.internetTest.downloadSpeed} Mbps</strong>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', flex: 1 }}>
                                            <span style={{ fontSize: '16px', color: colors.gray600 }}>Subida</span>
                                            <strong style={{ fontSize: '24px', color: '#16a34a' }}>{order.internetTest.uploadSpeed} Mbps</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: `2px solid ${colors.gray200}`,
                            paddingTop: '20px',
                            marginTop: 'auto',
                        }}
                    >
                        <h3 style={{ fontSize: '20px', color: colors.primary, marginBottom: '10px' }}>Firma del Cliente</h3>
                        {order.customerSignature ? (
                            <img src={order.customerSignature} height={80} style={{ objectFit: 'contain', marginBottom: '10px' }} />
                        ) : (
                            <div style={{ height: '80px', marginBottom: '10px' }}></div>
                        )}
                        <p style={{ fontSize: '16px', color: colors.gray600, margin: 0 }}>Acepto conforme el trabajo realizado</p>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 800,
            }
        );
    } catch (e: any) {
        console.error('Error generating image:', e);
        return new Response(`Failed to generate the image: ${e.message}`, {
            status: 500,
        });
    }
}
