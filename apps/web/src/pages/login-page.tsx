import { useMutation } from "@tanstack/react-query";
import { LoginRequestSchema } from "@fieldassist/shared";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { authApi } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";

const roleHomeMap = {
  SUPERVISOR: "/app/dashboard",
  TECHNICIAN: "/app/work-orders",
} as const;

export const LoginPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [email, setEmail] = useState("technician@fieldassist.local");
  const [password, setPassword] = useState("FieldAssist123!");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session.token, session.user);
      void navigate(roleHomeMap[session.user.role], {
        replace: true,
      });
    },
  });

  if (token && user) {
    return <Navigate replace to={roleHomeMap[user.role]} />;
  }

  return (
    <div className="surface-grid min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="panel relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent" />
          <div className="relative grid gap-8">
            <div className="space-y-4">
              <span className="data-label">Voice-first operations</span>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-steel-900 sm:text-5xl">
                Headset-friendly work execution for technicians and supervisors.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-steel-600">
                FieldAssist keeps assigned work visible, actions deliberate, and
                frontline activity easy to inspect in motion.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-steel-900 p-5 text-white">
                <div className="data-label text-white/60">Technician flow</div>
                <div className="mt-2 text-lg font-semibold">
                  Assigned work, step guidance, incident reporting.
                </div>
              </div>
              <div className="rounded-3xl bg-white/75 p-5">
                <div className="data-label">Supervisor view</div>
                <div className="mt-2 text-lg font-semibold text-steel-900">
                  Active work orders, activity trail, and incident awareness.
                </div>
              </div>
              <div className="rounded-3xl bg-accent-50 p-5">
                <div className="data-label text-accent-600">Device-first</div>
                <div className="mt-2 text-lg font-semibold text-steel-900">
                  Large controls, clear primary actions, and minimal clutter.
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/70 bg-white/75 p-5 text-sm text-steel-600">
              <div className="data-label">Demo accounts</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-steel-900">
                  technician@fieldassist.local
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.24em]">
                  FieldAssist123!
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-steel-900">
                  supervisor@fieldassist.local
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.24em]">
                  FieldAssist123!
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel flex items-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-xl space-y-6">
            <div className="space-y-2">
              <span className="data-label">Access workspace</span>
              <h2 className="text-3xl font-semibold text-steel-900">Sign in</h2>
              <p className="text-sm text-steel-600">
                Use a seeded technician or supervisor account to enter the
                portfolio environment.
              </p>
            </div>

            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();

                const result = LoginRequestSchema.safeParse({
                  email,
                  password,
                });

                if (!result.success) {
                  setValidationMessage(
                    "Enter a valid email and a password with at least 8 characters.",
                  );
                  return;
                }

                setValidationMessage(null);
                loginMutation.mutate(result.data);
              }}
            >
              <TextInput
                aria-label="Email"
                autoComplete="email"
                data-voice-label="email"
                label="Email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@fieldassist.local"
                type="email"
                value={email}
              />
              <TextInput
                aria-label="Password"
                autoComplete="current-password"
                data-voice-label="password"
                label="Password"
                message={validationMessage ?? loginMutation.error?.message}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type="password"
                value={password}
              />
              <Button
                aria-label="Sign in to FieldAssist"
                data-voice-label="sign in"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="rounded-3xl bg-steel-50 p-4 text-sm text-steel-600">
              <div className="data-label">Session model</div>
              <p className="mt-2">
                The app uses a bearer token and revalidates the saved session on
                reload before loading protected routes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
