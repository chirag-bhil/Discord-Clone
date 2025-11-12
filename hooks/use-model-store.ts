import { ChannelType, Server } from "@/lib/generated/prisma";
import { Channel } from "diagnostics_channel";
import { create } from "zustand";

export type ModelType = "createServer" | "invite" | "editServer" | "members" | "createChannel" | "leaveServer" | "deleteServer"| "deleteChannel" | "editChannel";

interface ModelData {
    server?: Server;
    channel?: Channel;
    channelType?: ChannelType;
}

interface ModelStore {
    model: ModelType | null;
    data: ModelData; 
    isOpen: boolean;
    onOpen: (type: ModelType, data?: ModelData) => void;
    onClose: () => void;
}

export const useModel = create<ModelStore>((set) => ({
    model: null,
    data: {}, 
    isOpen: false,
    onOpen: (type, data = {}) => set({ isOpen: true, model: type, data  }),
    onClose: () => set({ isOpen: false, model: null }),
}));

