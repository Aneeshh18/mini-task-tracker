import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";

const bootstrap = async (): Promise<void> => {
  await connectDatabase();

  try {
    await connectRedis();
  } catch (error) {
    console.warn("Redis unavailable. Continuing without cache.", error);
  }

  app.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
