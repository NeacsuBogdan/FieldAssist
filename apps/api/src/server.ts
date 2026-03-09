import "dotenv/config";

import { buildApp } from "./app.js";

const start = async (): Promise<void> => {
  const app = await buildApp();

  try {
    await app.listen({
      host: app.config.HOST,
      port: app.config.PORT,
    });
  } catch (error: unknown) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

void start();
