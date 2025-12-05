import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/contexts/UserContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50">
                <Sidebar />

                {/* Main Content Wrapper */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {children}
                </div>
            </div>
        </UserProvider>
    )
}