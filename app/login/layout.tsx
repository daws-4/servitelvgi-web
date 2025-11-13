import React from "react";

export const metadata = {
    title: "Login",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    // This layout overrides the root `app/layout.tsx` for the /login route.
    // Return children as-is so the global sidebar/layout does not render here.
    return <>{children}</>;
}
