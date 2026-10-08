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
import axios from "axios";


const DeleteMessageModel = () => {
    const { isOpen, onClose, model, data } = useModel();

    const isModelOpen = isOpen && model === 'deleteMessage';
    const { apiUrl, query } = data || {};

    const [isLoading, setIsLoading] = React.useState(false);
    const onClick = async () => {
        try {
            setIsLoading(true);
            const url = qs.stringifyUrl({
                url: apiUrl || "",
                query: query || {},
            });

            await axios.delete(url);
            onClose();
        
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
                       Delete Message
                   </DialogTitle>
                   <DialogDescription className="text-center text-muted-foreground ">
                          Are you sure you want to do this ? <br/> 
                          The message will be permanently deleted.
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

export default DeleteMessageModel;
