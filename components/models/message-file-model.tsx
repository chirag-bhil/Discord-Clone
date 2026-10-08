"use client";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import qs from "query-string"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { useModel } from "@/hooks/use-model-store";
import { on } from "events";

const formSchema = z.object({
    
    fileUrl: z.string().min(1, {
        message: "Attachment is required."
    })
})

export const MessageFileModel = () => {
    
    const { isOpen, onClose, model: type, data } = useModel();
    const router = useRouter();

    const isModelOpen = isOpen && type === "messageFile";
    const apiUrl = data?.apiUrl || "";    

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fileUrl: "",
        }
    });

    const handleClose = () => {
        form.reset();
        onClose();
    }

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: apiUrl || "",
                query: data?.query || {},
            })
            await axios.post(url, {
                ...values,
                content: values.fileUrl
            });

            form.reset();
            router.refresh();
            handleClose();
        } catch (error) {
            console.log(error);
        }
    }


    return (
        <Dialog open={isModelOpen} onOpenChange={handleClose}>
            <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Add an Attachment
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        send a file as a message
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-8 px-6">
                            <div className="flex items-center justify-center text-center">
                                <FormField 
                                    control={form.control}
                                    name="fileUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <FileUpload 
                                                    endpoint="messageFile"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter className="bg-muted px-6 py-4">
                            <Button variant="primary" disabled={isLoading}>
                                Send
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
