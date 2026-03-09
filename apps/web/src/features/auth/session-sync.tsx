import { useQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import { LoadingPanel } from "@/components/states/loading-panel";

import { authApi } from "./auth-api";
import { useAuthStore } from "./auth-store";

export const SessionSync = ({ children }: PropsWithChildren) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setUser = useAuthStore((state) => state.setUser);
  const sessionQuery = useQuery({
    enabled: Boolean(token),
    queryFn: authApi.me,
    queryKey: ["auth", "me"],
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setUser(sessionQuery.data);
    }
  }, [sessionQuery.data, setUser]);

  useEffect(() => {
    if (sessionQuery.isError) {
      clearSession();
    }
  }, [clearSession, sessionQuery.isError]);

  if (token && !user && sessionQuery.isPending) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <LoadingPanel
          subtitle="Revalidating the current session before loading the app shell."
          title="Restoring your workspace"
        />
      </div>
    );
  }

  return children;
};
