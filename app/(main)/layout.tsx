import { ReactNode } from "react";
import { MainProviders } from "@/components/provider/main-providers";

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return <MainProviders>{children}</MainProviders>;
}
