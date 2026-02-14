import { createClient, RedisClientType } from "redis";
import { env } from "./env";

let client: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType | null => client;

export const connectRedis = async (): Promise<void> => {
  if (client) {
    return;
  }

  client = createClient({ url: env.redisUrl });

  client.on("error", (error) => {
    console.error("Redis error:", error);
  });

  await client.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  if (!client) {
    return;
  }

  await client.quit();
  client = null;
};
