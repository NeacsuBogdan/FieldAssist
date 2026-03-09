import type { AuthUser } from "@fieldassist/shared";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  role: AuthUser["role"];
  to: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Work Orders",
    role: "TECHNICIAN",
    to: "/app/work-orders",
  },
  {
    label: "Dashboard",
    role: "SUPERVISOR",
    to: "/app/dashboard",
  },
  {
    label: "Incidents",
    role: "SUPERVISOR",
    to: "/app/incidents",
  },
];

export const AppShell = ({
  onLogout,
  user,
}: {
  onLogout: () => Promise<void>;
  user: AuthUser;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = navigationItems.filter((item) => item.role === user.role);

  return (
    <div className="surface-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:gap-6">
        <aside className="panel flex flex-col gap-8 p-5 lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:p-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div className="space-y-3">
              <span className="data-label">FieldAssist</span>
              <div>
                <h1 className="text-2xl font-semibold text-steel-900">
                  Frontline operations cockpit
                </h1>
                <p className="mt-2 text-sm text-steel-600">
                  Clear task execution for technicians, live oversight for
                  supervisors.
                </p>
              </div>
            </div>
            <div className="hidden rounded-2xl bg-steel-900 px-3 py-2 text-right text-white sm:block">
              <div className="data-label text-white/60">Role</div>
              <div className="mt-1 text-sm font-medium">
                {user.role.toLowerCase()}
              </div>
            </div>
          </div>

          <nav
            aria-label="Primary"
            className="grid gap-2"
            data-voice-label="primary navigation"
          >
            {items.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 items-center justify-between rounded-2xl border px-4 text-sm font-medium transition",
                    isActive
                      ? "border-steel-900 bg-steel-900 text-white"
                      : "border-transparent bg-steel-50/70 text-steel-600 hover:border-steel-200 hover:bg-white",
                  )
                }
                data-voice-label={item.label.toLowerCase()}
                key={item.to}
                to={item.to}
              >
                <span>{item.label}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                  {item.label.slice(0, 3)}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto grid gap-3 rounded-3xl bg-steel-900 p-4 text-white">
            <div className="data-label text-white/60">Active session</div>
            <div>
              <div className="text-lg font-semibold">{user.fullName}</div>
              <div className="mt-1 text-sm text-white/70">{user.email}</div>
            </div>
            <Button
              aria-label="Sign out of FieldAssist"
              className="justify-start bg-white text-steel-900 hover:bg-white/80"
              data-voice-label="sign out"
              onClick={() => {
                void (async () => {
                  await onLogout();
                  void navigate("/login", {
                    replace: true,
                  });
                })();
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <main className="mt-4 flex-1 lg:mt-0">
          <div className="panel flex min-h-[calc(100vh-3rem)] flex-col overflow-hidden">
            <header className="border-b border-steel-100 px-5 py-4 sm:px-8">
              <span className="data-label">
                {location.pathname
                  .replace("/app/", "")
                  .replaceAll("/", " / ") || "workspace"}
              </span>
            </header>
            <div className="flex-1 px-5 py-5 sm:px-8 sm:py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
