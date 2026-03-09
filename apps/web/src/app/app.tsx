import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { SessionSync } from "../features/auth/session-sync";
import { RealtimeSync } from "../features/realtime/realtime-sync";

export const App = () => (
  <AppProviders>
    <SessionSync>
      <RealtimeSync>
        <AppRouter />
      </RealtimeSync>
    </SessionSync>
  </AppProviders>
);
