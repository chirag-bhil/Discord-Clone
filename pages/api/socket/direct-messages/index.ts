import { currentProfilePages } from "@/lib/current-profile-pages";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo, DirectMessageWithMemberRoles } from "@/types";
import { db } from "@/lib/db";

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
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const profile = await currentProfilePages(req);
        const { content, fileUrl } = req.body;
        const conversationId = req.query.conversationId;

        if (!profile) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (typeof conversationId !== "string" || !conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }

        if (!content && !fileUrl) {
            return res.status(400).json({ message: "Content or file URL is required" });
        }

        const conversation = await db.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [
                    { memberOne: { profileId: profile.id } },
                    { memberTwo: { profileId: profile.id } },
                ],
            },
            include: {
                memberOne: true,
                memberTwo: true,
            },
        });

        if (!conversation) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const member = conversation.memberOne.profileId === profile.id
            ? conversation.memberOne
            : conversation.memberTwo;

        const message = await db.directMessage.create({
            data: {
                content: content || "",
                fileUrl: fileUrl || null,
                conversationId,
                memberId: member.id,
            },
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
        res?.socket?.server?.io?.emit(`chat:${conversationId}:messages`, payload);

        return res.status(200).json(payload);
    } catch (error) {
        console.error("[DIRECT_MESSAGES_POST]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
