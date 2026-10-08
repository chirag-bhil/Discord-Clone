"use client";

import axios from "axios";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useModel } from "@/hooks/use-model-store";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/generated/prisma";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji-picker";

const formSchema = z.object({
    name: z.string().min(1, { message: "Role name is required." }),
    color: z.string().min(1, { message: "Color is required." }),
    isGradient: z.boolean().default(false),
    isGlow: z.boolean().default(false),
    icon: z.string().optional(),
    canManageServer: z.boolean().default(false),
    canManageChannels: z.boolean().default(false),
    canManageRoles: z.boolean().default(false),
    canManageMessages: z.boolean().default(false),
    canKickMembers: z.boolean().default(false),
    canBanMembers: z.boolean().default(false),
    canCreateInvite: z.boolean().default(true),
    canSendMessages: z.boolean().default(true),
    canAttachFiles: z.boolean().default(true),
});

type RoleFormInput = z.input<typeof formSchema>;
type RoleFormValues = z.output<typeof formSchema>;
type PermissionField = keyof Pick<
    RoleFormValues,
    "canManageServer" | "canManageChannels" | "canManageRoles" |
    "canManageMessages" | "canKickMembers" | "canBanMembers" |
    "canCreateInvite" | "canSendMessages" | "canAttachFiles"
>;

const permissionFields: { name: PermissionField; label: string; description: string }[] = [
    { name: "canManageServer", label: "Manage server", description: "Edit server settings and invite links." },
    { name: "canManageChannels", label: "Manage channels", description: "Create, edit, and remove channels." },
    { name: "canManageRoles", label: "Manage roles", description: "Create and configure custom roles." },
    { name: "canManageMessages", label: "Manage messages", description: "Edit or remove other members' messages." },
    { name: "canKickMembers", label: "Kick members", description: "Remove members from this server." },
    { name: "canBanMembers", label: "Ban members", description: "Prevent members from rejoining." },
    { name: "canCreateInvite", label: "Create invites", description: "Generate invite links for the server." },
    { name: "canSendMessages", label: "Send messages", description: "Post messages in accessible channels." },
    { name: "canAttachFiles", label: "Attach files", description: "Upload files to messages." },
];

const defaultValues: RoleFormValues = {
    name: "",
    color: "#99aab5",
    isGradient: false,
    isGlow: false,
    icon: "",
    canManageServer: false,
    canManageChannels: false,
    canManageRoles: false,
    canManageMessages: false,
    canKickMembers: false,
    canBanMembers: false,
    canCreateInvite: true,
    canSendMessages: true,
    canAttachFiles: true,
};

export const RolesModal = () => {
    const { isOpen, onClose, model, data } = useModel();
    const router = useRouter();
    const server = data.server;
    const isModalOpen = isOpen && model === "roles";

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const form = useForm<RoleFormInput, unknown, RoleFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const resetForm = useCallback(() => {
        setEditingRoleId(null);
        form.reset(defaultValues);
    }, [form]);

    const fetchRoles = useCallback(async () => {
        if (!server?.id) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/servers/${server.id}/roles`);
            setRoles(response.data);
        } catch (error) {
            console.error("Failed to load roles:", error);
        } finally {
            setLoading(false);
        }
    }, [server?.id]);

    useEffect(() => {
        if (isModalOpen) {
            void fetchRoles();
        }
    }, [fetchRoles, isModalOpen]);

    const roleName = form.watch("name");

    useEffect(() => {
        if (roleName.toLowerCase() === "admin" && !editingRoleId) {
            form.setValue("color", "#ff0000");
            form.setValue("isGradient", true);
        }
    }, [editingRoleId, form, roleName]);

    const onSubmit = async (values: RoleFormValues) => {
        if (!server?.id) return;

        try {
            setLoading(true);
            if (editingRoleId) {
                await axios.patch(`/api/servers/${server.id}/roles/${editingRoleId}`, values);
            } else {
                await axios.post(`/api/servers/${server.id}/roles`, values);
            }
            await fetchRoles();
            resetForm();
            router.refresh();
        } catch (error) {
            console.error("Failed to save role:", error);
        } finally {
            setLoading(false);
        }
    };

    const onEdit = (role: Role) => {
        setEditingRoleId(role.id);
        form.reset({
            name: role.name,
            color: role.color,
            isGradient: role.isGradient,
            isGlow: role.isGlow,
            icon: role.icon || "",
            canManageServer: role.canManageServer,
            canManageChannels: role.canManageChannels,
            canManageRoles: role.canManageRoles,
            canManageMessages: role.canManageMessages,
            canKickMembers: role.canKickMembers,
            canBanMembers: role.canBanMembers,
            canCreateInvite: role.canCreateInvite,
            canSendMessages: role.canSendMessages,
            canAttachFiles: role.canAttachFiles,
        });
    };

    const onDelete = async (roleId: string) => {
        if (!server?.id) return;

        try {
            setLoading(true);
            await axios.delete(`/api/servers/${server.id}/roles/${roleId}`);
            await fetchRoles();
            if (editingRoleId === roleId) resetForm();
            router.refresh();
        } catch (error) {
            console.error("Failed to delete role:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
            onClose();
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="!flex h-[min(720px,calc(100vh-2rem))] w-[calc(100vw-2rem)] !max-w-5xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Shield className="h-5 w-5" />
                        </span>
                        Manage roles
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-left text-muted-foreground">
                        Create roles and choose what members can do in {server?.name || "this server"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                    <aside className="flex max-h-56 shrink-0 flex-col border-b bg-muted/30 p-3 md:max-h-none md:w-64 md:border-b-0 md:border-r">
                        <div className="mb-3 flex items-center justify-between px-2">
                            <div>
                                <p className="text-sm font-semibold">Roles</p>
                                <p className="text-xs text-muted-foreground">{roles.length} custom roles</p>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={resetForm}
                                aria-label="Create a new role"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            type="button"
                            variant={editingRoleId === null ? "secondary" : "ghost"}
                            className="mb-2 w-full justify-start"
                            onClick={resetForm}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create role
                        </Button>

                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                            <div className="space-y-1">
                                {loading && roles.length === 0 ? (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : roles.length === 0 ? (
                                    <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                                        No custom roles yet.
                                    </p>
                                ) : roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className={cn(
                                            "group flex items-center gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:bg-accent",
                                            editingRoleId === role.id && "border-border bg-accent"
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            onClick={() => onEdit(role)}
                                        >
                                            <span
                                                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                                                style={{
                                                    backgroundColor: role.color,
                                                    boxShadow: role.isGlow ? `0 0 8px ${role.color}` : undefined,
                                                }}
                                            />
                                            <span
                                                className="truncate text-sm font-medium"
                                                style={role.isGradient ? {
                                                    backgroundImage: `linear-gradient(to right, ${role.color}, #ff00cc)`,
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                } : { color: role.color }}
                                            >
                                                {role.name}
                                            </span>
                                        </button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 shrink-0 text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                                            onClick={() => void onDelete(role.id)}
                                            disabled={loading}
                                            aria-label={`Delete ${role.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                                    <div>
                                        <p className="text-base font-semibold">
                                            {editingRoleId ? "Edit role" : "Create a role"}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Give this role a clear name and configure its appearance.
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={loading}
                                                        placeholder="e.g. Moderator"
                                                        className="bg-muted/40"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <section className="rounded-lg border bg-card p-4">
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold">Appearance</p>
                                            <p className="text-xs text-muted-foreground">Customize how this role appears next to a member.</p>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end">
                                            <FormField
                                                control={form.control}
                                                name="color"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Role color</FormLabel>
                                                        <div className="flex gap-2">
                                                            <FormControl>
                                                                <Input type="color" {...field} disabled={loading} className="h-9 w-12 cursor-pointer bg-muted/40 p-1" />
                                                            </FormControl>
                                                            <Input value={field.value} onChange={field.onChange} disabled={loading} className="bg-muted/40" aria-label="Role color hex value" />
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="icon"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Icon</FormLabel>
                                                        <FormControl>
                                                            <EmojiPicker onChange={field.onChange}>
                                                                <Button type="button" variant="outline" className="h-9 w-12 px-0 text-lg" aria-label="Choose role icon">
                                                                    {field.value || <Plus className="h-4 w-4" />}
                                                                </Button>
                                                            </EmojiPicker>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            {(["isGradient", "isGlow"] as const).map((name) => (
                                                <FormField
                                                    key={name}
                                                    control={form.control}
                                                    name={name}
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center gap-2 space-y-0 sm:flex-col sm:items-start sm:gap-1">
                                                            <FormLabel className="text-sm capitalize">{name === "isGradient" ? "Gradient" : "Glow"}</FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.value}
                                                                    onChange={field.onChange}
                                                                    disabled={loading}
                                                                    className="h-4 w-4 accent-primary"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <div className="mb-3">
                                            <p className="text-sm font-semibold">Permissions</p>
                                            <p className="text-xs text-muted-foreground">Choose the actions members with this role can perform.</p>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {permissionFields.map((permission) => (
                                                <FormField
                                                    key={permission.name}
                                                    control={form.control}
                                                    name={permission.name}
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
                                                            <div className="min-w-0 space-y-1">
                                                                <FormLabel className="text-sm font-medium">{permission.label}</FormLabel>
                                                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                            </div>
                                                            <FormControl>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.value}
                                                                    onChange={field.onChange}
                                                                    disabled={loading}
                                                                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-background px-5 py-4 sm:px-6">
                                    {editingRoleId && (
                                        <Button type="button" variant="ghost" onClick={resetForm} disabled={loading}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {editingRoleId ? "Save changes" : "Create role"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </main>
                </div>
            </DialogContent>
        </Dialog>
    );
};
