"use client";
import qs from "query-string";
import { useModel } from "@/hooks/use-model-store";
import { Check, MoreVertical, Shield, ShieldQuestion, Crown, Settings, Gavel, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvtar } from "@/components/user-avtar";
import { ServerWithMembersWithProfile } from "@/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuPortal,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSub
}from "@/components/ui/dropdown-menu"
import { MemberRole, Role } from "@/lib/generated/prisma";
import axios from "axios";
import { useRouter } from "next/navigation";
import { set } from "zod";
import { on } from "events";

const roleIconMap = {
    "GUEST": null,
    "MODERATOR": <Settings className="h-4 w-4 ml-2 text-indigo-500"/>,
    "ADMIN": <Crown className="h-4 w-4 ml-2 text-rose-500"/>
}

const MembersModel = () => {
    const router = useRouter();
    const { onOpen, isOpen, onClose, model, data } = useModel();
    const [loadingId, setLoadingId] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    
    const isModelOpen = isOpen && model === 'members';
    const { server } = data as { server: ServerWithMembersWithProfile };

    useEffect(() => {
        if (isModelOpen && server?.id) {
            fetchRoles();
        }
    }, [isModelOpen, server?.id]);

    const fetchRoles = async () => {
        try {
            const response = await axios.get(`/api/servers/${server?.id}/roles`);
            setRoles(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    const onKick = async (memberId: string) => {
        try {
            setLoadingId(memberId);
            const url = qs.stringifyUrl({
                url: `/api/members/${memberId}`,
                query: {
                    serverId: server?.id,
                },
            });
            const response = await axios.delete(url);
            router.refresh();
            onOpen('members', { server: response.data });
            
        } catch (error) {
            console.error("Error kicking member:", error);
        } finally {
            setLoadingId("");
        }
    }

    // Prevent hydration issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }
    const onRoleChange = async (memberId: string, role: MemberRole) => {
        try {
            setLoadingId(memberId);           
            const url = qs.stringifyUrl({
                url: `/api/members/${memberId}`,
                query: {
                    serverId: server?.id,
                }
            });
            const response = await axios.patch(url, { role });
            router.refresh();
            onOpen('members', { server: response.data });

        } catch (error) {
            console.error("Error changing role:", error);
        } finally {
            setLoadingId("");
        }
    };

    const onAssignRole = async (memberId: string, roleId: string, hasRole: boolean) => {
        try {
            setLoadingId(memberId);
            const url = `/api/servers/${server?.id}/members/${memberId}/roles`;
            
            let response;
            if (hasRole) {
                response = await axios.delete(url, { data: { roleId } });
            } else {
                response = await axios.post(url, { roleId });
            }
            
            router.refresh();
            onOpen('members', { server: response.data });
        } catch (error) {
            console.error("Error assigning role:", error);
        } finally {
            setLoadingId("");
        }
    }

    return (
        <Dialog open={isModelOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden max-w-md">
                <DialogHeader className="pt-6 px-6">
                   <DialogTitle className="text-xl text-center font-bold">
                       Manage Members
                   </DialogTitle>
                   <DialogDescription className="text-center text-muted-foreground">
                    {server?.members?.length} Members
                   </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[420px] pr-6">
                    {server?.members?.map((member) => (
                        <div key={member.id} className="flex items-center gap-x-2 mb-6 px-6">
                            <UserAvtar src={member.profile.imageUrl} />
                            <div className="flex flex-col gap-y-1">
                                <div className="text-xs font-semibold flex items-center gap-x-1">
                                    {member.profile.name}
                                    {roleIconMap[member.role]}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {member.profile.email}
                                </p>
                            </div>
                            {loadingId !== member.id && (
                                <div className="ml-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <MoreVertical className="h-5 w-5 text-muted-foreground"/>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="left">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger
                                                    className="flex items-center"
                                                >
                                                    <ShieldQuestion 
                                                        className="h-4 w-4 mr-2"
                                                    />
                                                    <span>Role</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {server.profileId !== member.profileId && (
                                                            <>
                                                                <DropdownMenuItem 
                                                                onClick={() => onRoleChange(member.id, "GUEST")}
                                                                >
                                                                    <Shield className="h-4 w-4 mr-2" />
                                                                    Guest
                                                                    {member.role === "GUEST" && (
                                                                        <Check 
                                                                            className="ml-auto h-4 w-4"
                                                                        />
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                onClick={() => onRoleChange(member.id, "MODERATOR")}
                                                                >
                                                                    <Settings className="h-4 w-4 mr-2" />
                                                                    Moderator
                                                                    {member.role === "MODERATOR" && (
                                                                        <Check 
                                                                            className="ml-auto h-4 w-4"
                                                                        />
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                            Custom Roles
                                                        </div>
                                                        {roles.map((role) => {
                                                            const hasRole = member.roles?.some((r) => r.id === role.id);
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={role.id}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        onAssignRole(member.id, role.id, hasRole);
                                                                    }}
                                                                >
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full mr-2"
                                                                        style={{ 
                                                                            background: role.color,
                                                                            boxShadow: role.isGlow ? `0 0 10px ${role.color}, 0 0 20px ${role.color}` : 'none'
                                                                        }}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            ...(role.isGradient ? {
                                                                                backgroundImage: `linear-gradient(to right, ${role.color}, #ff00cc)`,
                                                                                WebkitBackgroundClip: "text",
                                                                                WebkitTextFillColor: "transparent"
                                                                            } : { color: role.color }),
                                                                            ...(role.isGlow ? {
                                                                                textShadow: `0 0 10px ${role.color}, 0 0 20px ${role.color}`
                                                                            } : {})
                                                                        }}
                                                                    >
                                                                        {role.name}
                                                                    </span>
                                                                    {hasRole && (
                                                                        <Check className="ml-auto h-4 w-4" />
                                                                    )}
                                                                </DropdownMenuItem>
                                                            );
                                                        })}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            {server.profileId !== member.profileId && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                    onClick={() => onKick(member.id)}
                                                    >
                                                        <Gavel className="h-4 w-4 mr-2" />
                                                        Kick
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {loadingId === member.id && (
                                <Loader2
                                    className="animate-spin text-muted-foreground ml-auto w-4 h-4"
                                />
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default MembersModel;
