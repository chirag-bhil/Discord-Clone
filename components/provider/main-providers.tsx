"use client";

import { ReactNode } from "react";
import { ModelProvider } from "@/components/provider/model-provider";
import { SocketProvider } from "@/components/provider/socket-provider";
import { QueryProvider } from "@/components/provider/query-provider";

export function MainProviders({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <SocketProvider>
                <ModelProvider>{children}</ModelProvider>
            </SocketProvider>
        </QueryProvider>
    );
}
