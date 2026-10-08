"use client";
import { useModel } from "@/hooks/use-model-store";
import qs from "query-string";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button";
import React from "react";
import { set } from "zod";
import axios from "axios";
import { on } from "events";
import { useRouter } from "next/navigation";



const DeleteChannelModel = () => {
    const { isOpen, onClose, model, data } = useModel();
    const router = useRouter();

    const isModelOpen = isOpen && model === 'deleteChannel';
    const { server, channel } = data || {};

    const [isLoading, setIsLoading] = React.useState(false);
    const onClick = async () => {
        try {
            setIsLoading(true);
            const url = qs.stringifyUrl({
                url: `/api/channels/${channel?.id}`,
                query: {
                    serverId: server?.id
                }
            });

            await axios.delete(url);
            onClose();
            
            // Navigate to server root and force refresh
            await router.push(`/servers/${server?.id}`);
            router.refresh();
            
            // Small delay then refresh again to ensure UI update
            setTimeout(() => {
                router.refresh();
            }, 100);
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
                       Delete Channel
                   </DialogTitle>
                   <DialogDescription className="text-center text-muted-foreground ">
                          Are you sure you want to do this ? <br/> 
                          <span className="text-indigo-500 font-semibold">#{String(channel?.name)}</span> will be deleted permanently.
                   </DialogDescription>
                   
                </DialogHeader> 
                <DialogFooter className="bg-muted px-6 py-4">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            variant="ghost"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={onClick}
                            variant="primary"
                        >
                            Confirm
                        </Button>
                    </div>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteChannelModel;
