"use client";
import { useModel } from "@/hooks/use-model-store";
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



const DeleteServerModel = () => {
    const { isOpen, onClose, model, data } = useModel();
    const router = useRouter();

    const isModelOpen = isOpen && model === 'deleteServer';
    const { server } = data || {};

    const [isLoading, setIsLoading] = React.useState(false);
    const onClick = async () => {
        try {
            setIsLoading(true);

            await axios.delete(`/api/servers/${server?.id}`);
            onClose();
            router.refresh();
            router.push('/');
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
                       Delete Server
                   </DialogTitle>
                   <DialogDescription className="text-center text-muted-foreground ">
                          Are you sure you want to do this ? <br/> 
                          <span className="text-indigo-500 font-semibold">{server?.name}</span> will be deleted permanently.
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

export default DeleteServerModel;
