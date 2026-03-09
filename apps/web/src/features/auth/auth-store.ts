import type { AuthUser } from "@fieldassist/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthState = {
  clearSession: () => void;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  token: string | null;
  user: AuthUser | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      clearSession: () =>
        set({
          token: null,
          user: null,
        }),
      setSession: (token, user) =>
        set({
          token,
          user,
        }),
      setUser: (user) =>
        set((state) => ({
          token: state.token,
          user,
        })),
      token: null,
      user: null,
    }),
    {
      name: "fieldassist-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
