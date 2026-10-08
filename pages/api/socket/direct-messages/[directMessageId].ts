import { currentProfilePages } from "@/lib/current-profile-pages";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo, DirectMessageWithMemberRoles } from "@/types";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma";

const withRoles = (message: DirectMessageWithMemberRoles) => ({
    ...message,
    member: {
        ...message.member,
        roles: message.member.memberRoles.map((memberRole) => memberRole.role),
    },
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo,
) {
    if (req.method !== "DELETE" && req.method !== "PATCH") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const profile = await currentProfilePages(req);
        const directMessageId = req.query.directMessageId;
        const conversationId = req.query.conversationId;

        if (!profile) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (typeof directMessageId !== "string" || typeof conversationId !== "string") {
            return res.status(400).json({ message: "Message and conversation IDs are required" });
        }

        const conversation = await db.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [
                    { memberOne: { profileId: profile.id } },
                    { memberTwo: { profileId: profile.id } },
                ],
            },
            include: { memberOne: true, memberTwo: true },
        });

        if (!conversation) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const member = conversation.memberOne.profileId === profile.id
            ? conversation.memberOne
            : conversation.memberTwo;

        const existingMessage = await db.directMessage.findFirst({
            where: { id: directMessageId, conversationId },
        });

        if (!existingMessage) {
            return res.status(404).json({ message: "Message not found" });
        }

        const isAuthor = existingMessage.memberId === member.id;
        const canDelete = isAuthor || member.role === MemberRole.ADMIN || member.role === MemberRole.MODERATOR;

        if (req.method === "DELETE" && !canDelete) {
            return res.status(403).json({ message: "You cannot delete this message" });
        }

        if (req.method === "PATCH" && !isAuthor) {
            return res.status(403).json({ message: "Only the author can edit this message" });
        }

        const data = req.method === "DELETE"
            ? { content: "This Message was deleted", fileUrl: null, deleted: true }
            : { content: req.body?.content };

        if (req.method === "PATCH" && !data.content) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const message = await db.directMessage.update({
            where: { id: directMessageId },
            data,
            include: {
                member: {
                    include: {
                        profile: true,
                        memberRoles: { include: { role: true } },
                    },
                },
            },
        });

        const payload = withRoles(message);
        res?.socket?.server?.io?.emit(`chat:${conversationId}:messages:update`, payload);

        return res.status(200).json(payload);
    } catch (error) {
        console.error("[DIRECT_MESSAGES_UPDATE]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
