import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChatHeader } from "@/components/chat/chat-header";

interface channelIdPageProps {
    params: {
        serverId: string;
        channelId: string;
    }
}

const channelIdPage = async ({ 
    params 
}: channelIdPageProps) => {
    const profile = await currentProfile();

    if (!profile) {
        return redirect('/sign-in');
    }

    const channel = await db.channel.findFirst({
        where: {
            id: params.channelId,
        },
    });

    const member = await db.member.findFirst({
        where: {
            serverId: params.serverId,
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
                serverId={params.serverId} 
                type="channel" 
            />
        </div>
    );
}
 
export default channelIdPage;