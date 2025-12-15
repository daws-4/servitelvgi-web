"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Component that handles 404 redirect notifications
 * Wrapped in Suspense boundary by parent component
 */
export function NotFoundHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const notFound = searchParams.get('notFound');
        const attempted = searchParams.get('attempted');

        if (notFound === 'true' && attempted) {
            alert(`⚠️ Página no encontrada\n\nLa ruta "${attempted}" no existe.\n\nFuiste redirigido al dashboard.`);
            // Clean URL
            router.replace('/dashboard');
        }
    }, [searchParams, router]);

    return null; // This component doesn't render anything
}
