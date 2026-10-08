"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string"
import { zodResolver } from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import { Member, MemberRole, Profile, Role } from "@/lib/generated/prisma";
import { UserAvtar } from "@/components/user-avtar";
import { ActionTooltip } from "../action-tooltip";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModel } from "@/hooks/use-model-store";

// Shape of the React Query cache for a chat (mirrors useInfiniteQuery output).
interface ChatCachePage { items: { id: string; content?: string; updatedAt?: string }[] }
type ChatCacheData = { pages: ChatCachePage[]; pageParams?: unknown[] };

interface ChatItemProps {
    id: string;
    content: string;
    member: Member & {
        profile: Profile;
        roles: Role[];
    };
    timestamp: string;
    fileUrl: string | null;
    deleted: boolean;
    currentMember: Member;
    isUpdated: boolean;
    socketUrl: string;
    socketQuery?: Record<string, string>;
}

const roleIconMap = {
    "GUEST": null,
    "MODERATOR": <ShieldCheck className="w-4 h-4 text-indigo-500 ml-2"/>,
    "ADMIN": <ShieldAlert className="w-4 h-4 text-rose-500 ml-2"/>
}

const formSchema = z.object({
    content: z.string().min(1),
})

export const ChatItem = ({
    id,
    content,
    member,
    timestamp,
    fileUrl,
    deleted,
    currentMember,
    isUpdated,
    socketUrl,
    socketQuery
}: ChatItemProps
) => {

    const [isEditing, setIsEditing] = useState(false);
    const { onOpen } = useModel();
    const router = useRouter();
    const params = useParams();

    const onMemberClick = () => {
        if (member.id === currentMember.id) {
            return;
        }

        router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
        
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.keyCode === 27) {
                setIsEditing(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content,
        }

    });

    const isLoading = form.formState.isSubmitting;
    const queryClient = useQueryClient();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: `${socketUrl}/${id}`,
                query: socketQuery
            });

            await axios.patch(url, values);

            form.reset();
            setIsEditing(false);

            // optimistic local update in case socket update is delayed
            try {
                const chatId = socketQuery?.channelId || socketQuery?.conversationId;
                if (chatId) {
                    queryClient.setQueryData([`chat:${chatId}`], (oldData: ChatCacheData | undefined) => {
                        if (!oldData || !oldData.pages) return oldData;
                        const newData = oldData.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) => item.id === id ? { ...item, content: values.content, updatedAt: new Date().toISOString() } : item)
                        }));
                        return { ...oldData, pages: newData };
                    });
                }
            } catch (err) {
                // swallow optimistic update errors
                console.error(err);
            }

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        form.reset({
            content: content,
        })
    }, [content]);

    const fileType = fileUrl?.split('.').pop();

    const isAdmin = currentMember.role === MemberRole.ADMIN;
    const isModerator = currentMember.role === MemberRole.MODERATOR;
    const isOwner = currentMember.id === member.id;
    const canDeleteMessage = !deleted && (isOwner || isAdmin || isModerator);
    const canEditMessage = !deleted && isOwner && !fileUrl;
    const isPDF = fileType === "pdf" && fileUrl;
    const isImage = fileUrl && !isPDF;
    const role = member.roles?.find((r) => r.isGradient || r.isGlow) || member.roles?.[0];


    return (
        <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
            <div className="group flex gap-x-2 items-start w-full">
                <div onClick={onMemberClick} className="cursor-pointer hover:drop-shadow-md transition">
                    <UserAvtar src={member.profile.imageUrl}/>
                </div>
                <div className="flex flex-col w-full">
                    <div className="flex items-center gap-x-2">
                        <div className="flex items-center">
                            <p 
                                onClick={onMemberClick} 
                                className="font-semibold text-sm hover:underline cursor-pointer hover:scale-105 inline-block origin-left transition-transform"
                                style={{
                                    ...(role?.isGradient ? {
                                        backgroundImage: `linear-gradient(to right, ${role.color}, #ff00cc)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent"
                                    } : { color: role?.color }),
                                    ...(role?.isGlow ? {
                                        textShadow: `0 0 10px ${role.color}, 0 0 20px ${role.color}`
                                    } : {})
                                }}
                            > 
                                {member.profile.name}
                            </p>
                            <ActionTooltip label={member.role}>
                                {roleIconMap[member.role]}
                            </ActionTooltip>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {timestamp}
                        </span>
                    </div>
                    {isImage && (
                        <a 
                            href={fileUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
                        >
                            <Image
                                src={fileUrl!}
                                alt={content}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </a>
                    )}
                    {isPDF && (
                        <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
                            <FileIcon 
                                className="h-10 w-10 fill-indigo-200 stroke-indigo-400"
                            />
                            <a 
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
                            >
                                PDF File
                            </a>
                        </div>
                    )}
                    {!fileUrl && !isEditing && (
                        <p className={cn(
                            "text-sm text-zinc-600 dark:text-zinc-300",
                            deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
                        )}>
                            {content}
                            {isUpdated && !deleted && (
                                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                                    (edited)
                                </span>
                            )}
                        </p>
                    )}

                    {!fileUrl && isEditing && (
                        <Form {...form}>
                            <form 
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex items-center w-full gap-x-2 pt-2"
                            >
                                <FormField 
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="relative w-full">
                                                    <Input 
                                                        disabled={isLoading}
                                                        className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                                                        placeholder="Edited message"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button disabled={isLoading} size="sm" variant="primary">
                                    Save
                                </Button>
                            </form>
                            <span className="text-[10px] mt-1 text-zinc-400"> 
                                Press Esc to cancel, enter to save
                            </span>
                        </Form>
                    )}
                </div>
            </div>
            {canDeleteMessage && (
                <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 rounded-sm border bg-popover text-popover-foreground">
                    {canEditMessage && (
                        <ActionTooltip label="Edit">
                            <Edit
                                onClick={() => setIsEditing(true)}
                                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                            />
                        </ActionTooltip>
                    )}
                    <ActionTooltip label="Delete">
                            <Trash
                                onClick={async () => {
                                    try {
                                        // open confirmation modal for delete
                                        onOpen("deleteMessage", {
                                            apiUrl: `${socketUrl}/${id}`,
                                            query: socketQuery
                                        });
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                            />
                        </ActionTooltip>
                </div>
            )}
        </div>
    )
}
