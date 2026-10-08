import { useSocket } from "@/components/provider/socket-provider";
import { Member, Message, Profile, Role } from "@/lib/generated/prisma";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatSoketProps = {
    addKey: string;
    updateKey: string;
    queryKey: string;
};

type MessageWithMemberWithProfile = Message & {
    member: Member & {
        profile: Profile;
        roles: Role[];
    };
};

// Shape of the React Query cache for a chat (mirrors useInfiniteQuery output).
type ChatCacheData = { pages: { items: MessageWithMemberWithProfile[] }[]; pageParams?: unknown[] };

export const useChatSocket = ({ addKey, updateKey, queryKey }: ChatSoketProps) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleUpdate = (message: MessageWithMemberWithProfile) => {
            console.debug("useChatSocket received update:", updateKey, message.id);
            queryClient.setQueryData([queryKey], (oldData: ChatCacheData | undefined) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return oldData;
                }

                const newData = oldData.pages.map((page) => ({
                    ...page,
                    items: page.items.map((item) =>
                        item.id === message.id ? message : item
                    ),
                }));

                return {
                    ...oldData,
                    pages: newData,
                };
            });
        };

        const handleAdd = (message: MessageWithMemberWithProfile) => {
            console.debug("useChatSocket received add:", addKey, message.id);
            queryClient.setQueryData([queryKey], (oldData: ChatCacheData | undefined) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return {
                        pages: [
                            {
                                items: [message],
                            },
                        ],
                    };
                }

                const newData = [...oldData.pages];

                // The sender may already have inserted the POST response.
                // Ignore the matching socket event instead of duplicating it.
                if (newData.some((page) => page.items.some((item) => item.id === message.id))) {
                    return oldData;
                }

                newData[0] = {
                    ...newData[0],
                    items: [message, ...newData[0].items],
                };

                return {
                    ...oldData,
                    pages: newData,
                };
            });
        };

        socket.on(updateKey, handleUpdate);
        socket.on(addKey, handleAdd);

        return () => {
            socket.off(updateKey, handleUpdate);
            socket.off(addKey, handleAdd);
        };
    }, [socket, addKey, updateKey, queryKey, queryClient]);
};
