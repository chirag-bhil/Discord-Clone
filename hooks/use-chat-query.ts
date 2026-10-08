import qs from "query-string";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSocket } from "@/components/provider/socket-provider";

interface ChatQueryProps {
    queryKey: string;
    apiUrl?: string;
    paramKey: "channelId" | "conversationId";
    paramValue: string;
}

export const useChatQuery = ({
    queryKey,
    apiUrl,
    paramKey,
    paramValue
}: ChatQueryProps) => {
    const { isConnected, socket } = useSocket();
    const fetchMessages = async ({ pageParam = undefined }) => {
        const url = qs.stringifyUrl({
            url: apiUrl || "",
            query: {
                cursor: pageParam,
                [paramKey]: paramValue,
            }
        }, { skipNull: true });

        const res = await fetch(url);

        return res.json();
    };
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: [queryKey],
        queryFn: fetchMessages,
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        // Socket events are the normal update path. Keep a slower fallback
        // poll only while the socket is unavailable.
        refetchInterval: isConnected ? false : 5000,
        initialPageParam: undefined,
        
    })

    return {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    }
    
    
}
