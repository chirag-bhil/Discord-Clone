import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";

interface MemberIdPageProps {
    params: Promise<{
        serverId: string;
        memberId: string;
    }>
}

const MemberIdPage = async ({
    params
}: MemberIdPageProps
) => {
    const { serverId, memberId } = await params;
    const profile = await currentProfile();

    if (!profile) {
        return redirect('/sign-in');
    }

    const currentMember = await db.member.findFirst({
        where: {
            serverId,
            profileId: profile.id,
        },
        include: {
            profile: true
        }
        
    });

    if (!currentMember) {
        return redirect("/");
    }

    const otherMember = await db.member.findFirst({
        where: {
            id: memberId,
            serverId,
        },
        include: {
            profile: true,
        },
    });

    if (!otherMember || otherMember.id === currentMember.id) {
        return redirect(`/servers/${serverId}`);
    }

    const conversation = await getOrCreateConversation(currentMember.id, otherMember.id);

    if (!conversation) {
        return redirect(`/servers/${serverId}`);
    }

    const { memberOne, memberTwo } = conversation;
    const conversationMember = memberOne.profileId === profile.id ? memberTwo : memberOne;

    return (  
        <div className="flex h-full flex-col bg-background">
            <ChatHeader 
                imageUrl={conversationMember.profile.imageUrl}
                name={conversationMember.profile.name}
                serverId={serverId}
                type="conversation"
            />
            <ChatMessages
                member={currentMember}
                name={conversationMember.profile.name}
                imageUrl={conversationMember.profile.imageUrl}
                chatId={conversation.id}
                type="conversation"
                apiUrl="/api/direct-messages"
                socketUrl="/api/socket/direct-messages"
                socketQuery={{ conversationId: conversation.id }}
                paramKey="conversationId"
                paramValue={conversation.id}
            />
            <ChatInput
                name={conversationMember.profile.name}
                type="conversation"
                apiUrl="/api/socket/direct-messages"
                query={{ conversationId: conversation.id }}
            />
        </div>
    );
}
 
export default MemberIdPage;
