"use client";
import { useModel } from "@/hooks/use-model-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { Check, Copy, RefreshCcw } from "lucide-react";
import { useOrigin } from "@/hooks/use-origin";
import React from "react";
import { set } from "zod";
import axios from "axios";



const InviteModel = () => {
    const { onOpen, isOpen, onClose, model, data } = useModel();
    const origin = useOrigin();

    const isModelOpen = isOpen && model === 'invite';
    const { server } = data || {};

    const [copied, setCopied] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);

        setTimeout(() => setCopied(false), 1000);
    }

    const onNew = async () => {
        try {   
            setIsLoading(true);
            const response = await axios.patch(`/api/servers/${server?.id}/invite-code`);
            onOpen("invite", { server: response.data });

        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isModelOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 overflow-hidden max-w-sm">
                <DialogHeader className="pt-6 px-6">
                   <DialogTitle className="text-xl text-center font-bold">
                       Invite Friends
                   </DialogTitle>
                   
                </DialogHeader> 
                <div className="p-6">
                    <Label
                        className="uppercase text-xs font-bold text-muted-foreground"
                    >
                        Server Invite Link
                    </Label>
                    <div className="flex items-center mt-2 gap-x-2">
                        <Input 
                            disabled={isLoading}
                            style={{ backgroundColor: 'rgba(212, 212, 216, 0.5)', border: 'none' }}
                            className="focus-visible:ring-0 text-foreground focus-visible:ring-offset-0"
                            value={inviteUrl}
                        />
                        <Button disabled={isLoading}  onClick={onCopy} size="icon">
                            {copied ? <Check /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <Button
                        onClick={onNew}
                        disabled={isLoading}
                        variant="link"
                        size="sm"
                        className="text-xs text-muted-foreground mt-4"
                    >
                        Generate A New Link
                        <RefreshCcw className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InviteModel;
