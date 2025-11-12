import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
try {
    const { channelId } = await params;
    const profile = await currentProfile();
    const { searchParams} = new URL(req.url);
    
    const serverId = searchParams.get("serverId");

    if (!profile) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!serverId) {
        return new Response("Server ID is required", { status: 400 });
    }

    if (!channelId) {
        return new Response("Channel ID is required", { status: 400 });
    }

    const server = await db.server.update({
        where: {
            id: serverId,
            members: {
                some: {
                    profileId: profile.id,
                    role: {
                        in: [MemberRole.ADMIN, MemberRole.MODERATOR],
                    }
                }
            }
        },
        data: {
            channels: {
                delete: {
                    id: channelId,
                    name : {
                        not: "general"
                    }
                }
            }
        }
        
    });

    return NextResponse.json(server);

} catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new Response("Internal Error", { status: 500 });
}
}
    
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
try {
    const { channelId } = await params;
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams} = new URL(req.url);
    
    const serverId = searchParams.get("serverId");

    if (!profile) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!serverId) {
        return new Response("Server ID is required", { status: 400 });
    }

    if (!channelId) {
        return new Response("Channel ID is required", { status: 400 });
    }

    if (name === "general") {
        return new Response("Cannot modify general channel", { status: 400 });
    }

    const server = await db.server.update({
        where: {
            id: serverId,
            members: {
                some: {
                    profileId: profile.id,
                    role: {
                        in: [MemberRole.ADMIN, MemberRole.MODERATOR],
                    }
                }
            }
        },
        data: {
            channels: {
                update: {
                    where: {
                        id: channelId,
                        NOT: {
                            name: "general"
                        }
                    },
                    data: {
                        name,
                        type
                    }
                }
            }
        }
        
    });

    return NextResponse.json(server);

} catch (error) {
    console.log("[CHANNEL_ID_PATCH]", error);
    return new Response("Internal Error", { status: 500 });
}
}