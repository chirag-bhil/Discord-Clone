"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import qs from "query-string"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { useModel } from "@/hooks/use-model-store";
import { EmojiPicker } from "@/components/emoji-picker";
import { QueryParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

interface ChatInputProps {
    apiUrl?: string;
    query: QueryParams;
    name: string;
    type: "conversation" | "channel";
}

const formSchema = z.object({
    content: z.string().min(1),

});

type ChatCacheData = {
    pages: {
        items: Array<{ id: string; [key: string]: unknown }>;
        pageParams?: unknown;
    }[];
    pageParams?: unknown[];
};

export const ChatInput = ({
    apiUrl,
    query,
    name,
    type
}: ChatInputProps
) => {
    const { onOpen } = useModel();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: apiUrl || "",
                query,
            })
            const response = await axios.post(url, values);

            // The response contains the fully hydrated message. Put it in
            // the current chat immediately, even if Socket.IO is reconnecting
            // or delivers the event after this request completes.
            const chatId = query.channelId ?? query.conversationId;
            const message = response.data as { id?: string } | undefined;

            if (typeof chatId === "string" && message?.id) {
                queryClient.setQueryData<ChatCacheData | undefined>(
                    [`chat:${chatId}`],
                    (oldData) => {
                        if (!oldData?.pages?.length) {
                            return oldData;
                        }

                        if (oldData.pages.some((page) =>
                            page.items.some((item) => item.id === message.id)
                        )) {
                            return oldData;
                        }

                        const pages = [...oldData.pages];
                        pages[0] = {
                            ...pages[0],
                            items: [message as ChatCacheData["pages"][number]["items"][number], ...pages[0].items],
                        };

                        return { ...oldData, pages };
                    },
                );
            }

            form.reset();
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField 
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative p-4 pb-6">
                                    <button
                                        type="button"
                                        onClick={() => onOpen("messageFile", {apiUrl, query})}

                                        className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                                    >
                                        <Plus 
                                            className="text-white dark:text-[#313338]"
                                        />

                                    </button>
                                    <Input
                                        {...field}
                                        disabled={isLoading}
                                        placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                                        className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                                    />
                                    <div className="absolute top-7 right-8">
                                        <EmojiPicker 
                                            onChange={(emoji: string) => {
                                                field.onChange(`${field.value}${emoji}`);
                                            }}
                                        />
                                    </div>

                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
