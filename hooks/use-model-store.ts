import { Server } from "@/lib/generated/prisma";
import { create } from "zustand";

export type ModelType = "createServer" | "invite" | "editServer";

interface ModelData {
    server?: Server;
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

