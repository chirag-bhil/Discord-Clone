import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";

interface channelIdPageProps {
    params: Promise<{
        serverId: string;
        channelId: string;
    }>
}

const channelIdPage = async ({ 
    params 
}: channelIdPageProps) => {
    const { serverId, channelId } = await params;
    
    const profile = await currentProfile();

    if (!profile) {
        return redirect('/sign-in');
    }

    const channel = await db.channel.findFirst({
        where: {
            id: channelId,
            serverId,
        },
    });

    const member = await db.member.findFirst({
        where: {
            serverId: serverId,
            profileId: profile.id,
        },
    });

    if (!channel || !member) {
        redirect("/");
    }

    return (  
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
            <ChatHeader 
                name={channel.name} 
                serverId={serverId} 
                type="channel" 
            />
            <ChatMessages 
                member={member}
                name={channel.name}
                chatId={channel.id}
                type="channel"
                apiUrl="/api/messages"
                socketUrl="/api/socket/messages"
                socketQuery={{
                    serverId: channel.serverId,
                    channelId: channel.id
                }}
                paramKey="channelId"
                paramValue={channel.id}
            />
            <ChatInput 
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{ serverId: channel.serverId, channelId: channel.id }}
            />
        </div>
    );
}
 
export default channelIdPage;
