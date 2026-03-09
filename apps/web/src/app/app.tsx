import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { SessionSync } from "../features/auth/session-sync";

export const App = () => (
  <AppProviders>
    <SessionSync>
      <AppRouter />
    </SessionSync>
  </AppProviders>
);
