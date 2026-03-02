"use client";

import React from "react";

interface Props {
    children: React.ReactNode;
    /** Identificador opcional para el log (ej. ticket_id o número de orden) */
    orderId?: string;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

/**
 * CertificateErrorBoundary
 *
 * Envuelve cada <OrderCompletionCertificate /> durante la generación masiva.
 * Si el certificado lanza cualquier error de render (ej. mat.item null),
 * muestra un placeholder en lugar de crashear toda la página/generación.
 */
export class CertificateErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(
            `[CertificateErrorBoundary] Error en orden ${this.props.orderId ?? "desconocida"}:`,
            error,
            info.componentStack
        );
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: "800px",
                        padding: "32px",
                        textAlign: "center",
                        border: "2px dashed #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#fafafa",
                        color: "#6b7280",
                        fontFamily: "sans-serif",
                    }}
                >
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                        ⚠️ Error al generar certificado
                    </p>
                    {this.props.orderId && (
                        <p style={{ fontSize: "13px", marginBottom: "6px" }}>
                            Orden: <strong>{this.props.orderId}</strong>
                        </p>
                    )}
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>{this.state.errorMessage}</p>
                    <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>
                        Este certificado fue omitido. Los demás se generaron correctamente.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
