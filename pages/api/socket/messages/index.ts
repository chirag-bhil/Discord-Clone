import { currentProfilePages } from "@/lib/current-profile-pages";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo, MessageWithMemberRoles } from "@/types";
import { db } from "@/lib/db";

// Reshape the Mongo explicit MemberRoleLink join back to `member.roles: Role[]`.
const withRoles = (msg: MessageWithMemberRoles) => ({
    ...msg,
    member: {
        ...msg.member,
        roles: msg.member.memberRoles.map((mr) => mr.role),
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
        const { serverId, channelId,} = req.query;

        if (!profile) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!serverId){
            return res.status(400).json({ message: "Server ID is required" });
        }

        if (!channelId){
            return res.status(400).json({ message: "Channel ID is required" });
        }

        if (!content && !fileUrl) {
            return res.status(400).json({ message: "Content or file URL is required" });
        }

        const server = await db.server.findFirst({
            where: {
                id: serverId as string,
                members: {
                    some: {
                        profileId: profile.id
                    }
                }
            },
            include: {
                members: true
            }
        });

        if (!server) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const channel = await db.channel.findFirst({
            where: {
                id: channelId as string,
                serverId: server.id,
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        
        const member = server.members.find((member) => member.profileId === profile.id);
        
        if (!member) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const message = await db.message.create({
            data: {
                content,
                fileUrl,
                channelId: channelId as string,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                        memberRoles: { include: { role: true } },
                    }
                }
            }
        });

        const channelKey = `chat:${channel.id}:messages`;

        res?.socket?.server?.io?.emit(channelKey, withRoles(message));

        return res.status(200).json(withRoles(message));


    } catch (error) {
        console.error("Error handling message:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}