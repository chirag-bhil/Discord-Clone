import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
    params: Promise<{ serverId: string }>;
}

export default async function ServerIdPage({
    params
}: ServerIdPageProps) {
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
        },
        include: {
            channels: {
                where: {
                    name: "general"
                },
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    const initialChannel = server?.channels[0];

    if (!initialChannel) {
        return null;
    }
    
    redirect(`/servers/${serverId}/channels/${initialChannel.id}`);
}