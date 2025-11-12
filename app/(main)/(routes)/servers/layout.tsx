import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { ReactNode } from "react";

interface ServersLayoutProps {
    children: ReactNode;
}

export default async function ServersLayout({
    children
}: ServersLayoutProps) {
    return (
        <div className="h-full">
            <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
                <NavigationSidebar />
            </div>
            <main className="h-full">
                {children}
            </main>
        </div>
    );
}
