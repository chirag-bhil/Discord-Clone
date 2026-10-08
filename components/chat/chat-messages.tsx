"use client";

import { Fragment } from "react";
import { ChatWelcome } from "./chat-welcome";
import { useChatQuery } from "@/hooks/use-chat-query";
import { Loader2, ServerCrash } from "lucide-react";
import { Message, Profile, Member, Role } from "@/lib/generated/prisma";
import { ChatItem } from "./chat-item";
import {format} from "date-fns";
import { useChatSocket } from "@/hooks/use-chat-socket";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
    member: Member & {
        profile: Profile;
        roles: Role[];
    }
}

interface ChatMessagesProps {
    name: string;
    imageUrl?: string;
    member: Member;
    chatId: string;
    apiUrl?: string;
    socketUrl?: string;
    socketQuery?: Record<string, string>;
    paramKey: "conversationId" | "channelId";
    paramValue: string;
    type: "conversation" | "channel";
}

export const ChatMessages = ({
    name,
    imageUrl,
    member,
    chatId,
    apiUrl,
    socketUrl,
    socketQuery,
    paramKey,
    paramValue,
    type
}: ChatMessagesProps) => {

    const queryKey = `chat:${chatId}`;
    const addKey = `chat:${chatId}:messages`;
    const updateKey = `chat:${chatId}:messages:update`;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useChatQuery({
        queryKey,
        apiUrl,
        paramKey,
        paramValue
    });
    useChatSocket({ queryKey, addKey, updateKey });

    if (status === "pending") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 
                    className="h-7 w-7 text-zinc-500 animate-spin my-4"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading messages...
                </p>
            </div>
        )
    }
    if (status === "error") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <ServerCrash 
                    className="h-7 w-7 text-zinc-500 my-4"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Something went wrong!
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-0 flex-1 flex flex-col py-4 overflow-y-auto">
            <div className="flex-1" />
            <ChatWelcome 
                type={type}
                name={name}
                imageUrl={imageUrl}
            />
            <div className="flex flex-col mt-auto">
                {data?.pages?.slice().reverse().map((group, i) => (
                    <Fragment key={i}>
                        {group.items.slice().reverse().map((message: MessageWithMemberWithProfile) => (
                            <ChatItem 
                                key={message.id}
                                id={message.id}
                                member={message.member}
                                currentMember={member}
                                content={message.content}
                                fileUrl={message.fileUrl}
                                deleted={message.deleted}
                                timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                                isUpdated={message.updatedAt !== message.createdAt}
                                socketUrl={socketUrl || ""}
                                socketQuery={socketQuery}                       
                            />
                        ))}
                    </Fragment>
                ))}
            </div>
        </div>
    )
}
