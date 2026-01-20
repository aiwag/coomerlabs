import { create } from "zustand";

interface HUDState {
    message: string | null;
    icon: string | null;
    type: "info" | "warning" | "success" | "neutral";
    isVisible: boolean;
    showHUD: (message: string, type?: HUDState["type"], icon?: string | null) => void;
}

export const useHUDStore = create<HUDState>((set) => ({
    message: null,
    icon: null,
    type: "neutral",
    isVisible: false,
    showHUD: (message, type = "neutral", icon = null) => {
        set({ message, type, icon, isVisible: true });
        // Auto-hide after 1.5s
        setTimeout(() => {
            set({ isVisible: false });
        }, 1500);
    },
}));
