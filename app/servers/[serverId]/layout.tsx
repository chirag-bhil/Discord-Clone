import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ServerSidebar } from "@/components/server/server-sidebar";

const ServerIdLayout = async ({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ serverId: string }>;
}) => {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) {
        return redirect('/sign-in');
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
    })

    if (!server) {
        return redirect('/sign-in');
    }

    return (  
        <div className="h-full">
            <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0 ml-[72px]">
                <ServerSidebar serverId={serverId} />
            </div>
            <main className="md:pl-60 h-full">
                {children}
            </main>
        </div>
    );
}
 
export default ServerIdLayout;
