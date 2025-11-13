import {Sidebar} from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return(
        <>
            <div className="relative flex flex-col h-screen">
                {/* Sidebar overlays the content; it does not push layout */}
                <Sidebar />
                {/* main content is offset by the small sidebar width (1/12 = 8.3333%)
                so the sidebar appears to "push" the layout in its collapsed state.
                When the sidebar expands on hover it is fixed and overlays the content
                (does not change this margin), satisfying the requirement. */}
                <main style={{ marginLeft: '8.3333333%' }} className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
                    {children}
                </main>

            </div>
        </>
    )
}