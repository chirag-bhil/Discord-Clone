import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { DirectMessageWithMemberRoles } from "@/types";

const MESSAGES_BATCH = 10;

const withRoles = (message: DirectMessageWithMemberRoles) => ({
    ...message,
    member: {
        ...message.member,
        roles: message.member.memberRoles.map((memberRole) => memberRole.role),
    },
});

export async function GET(request: Request) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get("conversationId");
        const cursor = searchParams.get("cursor");

        if (!profile) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (!conversationId) {
            return new Response("Bad Request: Missing conversationId", { status: 400 });
        }

        const conversation = await db.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [
                    { memberOne: { profileId: profile.id } },
                    { memberTwo: { profileId: profile.id } },
                ],
            },
            select: { id: true },
        });

        if (!conversation) {
            return new Response("Conversation not found", { status: 404 });
        }

        const directMessages = await db.directMessage.findMany({
            take: MESSAGES_BATCH,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where: { conversationId },
            include: {
                member: {
                    include: {
                        profile: true,
                        memberRoles: { include: { role: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return Response.json({
            items: directMessages.map(withRoles),
            nextCursor: directMessages.length === MESSAGES_BATCH
                ? directMessages[MESSAGES_BATCH - 1].id
                : null,
        });
    } catch (error) {
        console.error("[DIRECT_MESSAGES_GET]", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
