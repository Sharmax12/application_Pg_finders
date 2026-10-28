import {create} from "zustand";

interface UserStore {
    isAdmin: boolean;
    isAdminLoaded: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    setIsAdminLoaded: (loaded: boolean) => void;
}
export const useUserStore = create<UserStore>((set) => ({
    isAdmin: false,
    isAdminLoaded: false,
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setIsAdminLoaded: (isAdminLoaded) => set({ isAdminLoaded }),
}));