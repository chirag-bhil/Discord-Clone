import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const { serverId } = await params;
        const profile = await currentProfile();
        
        if (!profile) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new Response("Server ID is required", { status: 400 });
        }
        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: {
                    not: profile.id
                },
                members: {
                    some: {
                        profileId: profile.id
                    }
                }
            },
            data: {
                members: {
                    deleteMany: {
                        profileId: profile.id
                    }
                }
            }
        });
        return NextResponse.json(server);

    } catch (error) {
        console.log("[SERVERS_ID_LEAVE]", error);
        return new Response("Could not leave server at this time.", { status: 500 });
    }
}