import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MessageWithMemberRoles } from "@/types";
import next from "next";
import { NextResponse } from "next/server";

const MESSAGES_BATCH = 10;

// Mongo uses an explicit MemberRoleLink join model; reshape it back to the
// frontend contract `member.roles: Role[]` for socket-free REST responses.
const withRoles = (msg: MessageWithMemberRoles) => ({
    ...msg,
    member: {
        ...msg.member,
        roles: msg.member.memberRoles.map((mr) => mr.role),
    },
});

export async function GET(request: Request) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(request.url);

        const cursor = searchParams.get("cursor");
        const channelId = searchParams.get("channelId");
        
        if (!profile) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (!channelId) {
            return new Response("Bad Request: Missing channelId", { status: 400 });
        }

        // A channel id is not an authorization check. Verify that the
        // requesting profile is a member of the server that owns this
        // channel before reading any messages from it.
        const channel = await db.channel.findFirst({
            where: {
                id: channelId,
                server: {
                    members: {
                        some: {
                            profileId: profile.id,
                        },
                    },
                },
            },
            select: { id: true },
        });

        if (!channel) {
            return new Response("Channel not found", { status: 404 });
        }

        let messages: MessageWithMemberRoles[] = [];

        if (cursor) {
            messages = await db.message.findMany({
                take: MESSAGES_BATCH,
                skip: 1, 
                cursor: {
                    id: cursor
                },
                where: {
                    channelId,
                }, 
                include: {
                    member: {
                        include: {
                            profile: true,
                            memberRoles: { include: { role: true } },
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                }
            })
        }else {
            messages = await db.message.findMany({
                take: MESSAGES_BATCH,
                where: {
                    channelId,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                            memberRoles: { include: { role: true } },
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                }
            })
        }

        let nextCursor = null;

        if (messages.length === MESSAGES_BATCH) {
            nextCursor = messages[MESSAGES_BATCH - 1].id;
        }

        return NextResponse.json({
            items: messages.map(withRoles),
            nextCursor,
        });


    } catch (error) {
        console.log(error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
