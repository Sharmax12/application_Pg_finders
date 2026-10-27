import { create } from "zustand";

interface UserStore {
  isAdmin: boolean;
  isAdminLoaded: boolean;
  setAdminStatus: (isAdmin: boolean, isLoaded: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  isAdmin: false,
  isAdminLoaded: false,
  setAdminStatus: (isAdmin, isLoaded) =>
    set({ isAdmin, isAdminLoaded: isLoaded }),
}));
