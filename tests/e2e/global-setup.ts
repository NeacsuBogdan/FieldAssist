import { execSync } from "node:child_process";

const globalSetup = () => {
  execSync("pnpm db:seed", {
    stdio: "inherit",
  });
};

export default globalSetup;
