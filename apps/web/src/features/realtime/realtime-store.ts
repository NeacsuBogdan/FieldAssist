import { create } from "zustand";

export type RealtimeStatus = "connecting" | "live" | "offline";

type RealtimeState = {
  setStatus: (status: RealtimeStatus) => void;
  status: RealtimeStatus;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  setStatus: (status) =>
    set({
      status,
    }),
  status: "offline",
}));
