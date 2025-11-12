import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { ReactNode } from "react";

interface ServerIdLayoutProps {
    children: ReactNode;
    params: Promise<{ serverId: string }>;
}

export default async function ServerIdLayout({
    children,
    params,
}: ServerIdLayoutProps) {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) {
        redirect('/sign-in');
        return null;
    }

    const server = await db.server.findUnique({
        where: {
            id: serverId,
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    if (!server) {
        redirect('/sign-in');
        return null;
    }

    return (
        <div className="h-full">
            <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0 ml-[72px]">
                <ServerSidebar serverId={serverId} />
            </div>
            <main className="h-full md:pl-[312px]">
                {children}
            </main>
        </div>
    );
}
