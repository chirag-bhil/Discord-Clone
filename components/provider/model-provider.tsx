"use client";

import { ReactNode } from "react";
import CreateServerModel from "@/components/models/create-server-model";
import InviteModel from "@/components/models/invite-model";
import EditServerModel from "@/components/models/edit-server-model";
import MembersModel from "@/components/models/members-model";
import CreateChannelModel from "@/components/models/create-channel-model";
import LeaveServerModel from "@/components/models/leave-server-model";
import DeleteServerModel from "@/components/models/delete-server-model";
import DeleteChannelModel from "@/components/models/delete-channel-model";
import EditChannelModel from "@/components/models/edit-channel-model";
import { MessageFileModel } from "@/components/models/message-file-model";
import DeleteMessageModel from "@/components/models/delete-message-model";
import { RolesModal } from "@/components/models/roles-modal";


export const ModelProvider = ({ children }: { children?: ReactNode }) => {
    return (
        <>
            <CreateServerModel />
            <InviteModel />
            <EditServerModel />
            <MembersModel />
            <CreateChannelModel />
            <LeaveServerModel />
            <DeleteServerModel />
            <DeleteChannelModel />
            <EditChannelModel />
            <MessageFileModel />
            <DeleteMessageModel />
            <RolesModal />
            {children}
        </>
    );
}
