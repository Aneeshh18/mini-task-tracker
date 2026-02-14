import { getRedisClient } from "../config/redis";
import { env } from "../config/env";

const getTasksCacheKey = (userId: string): string => `tasks:${userId}`;

export const cacheTasks = async (userId: string, value: unknown): Promise<void> => {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  await client.set(getTasksCacheKey(userId), JSON.stringify(value), {
    EX: env.cacheTtlSeconds
  });
};

export const getCachedTasks = async (userId: string): Promise<unknown[] | null> => {
  const client = getRedisClient();

  if (!client) {
    return null;
  }

  const raw = await client.get(getTasksCacheKey(userId));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as unknown[];
};

export const invalidateTasksCache = async (userId: string): Promise<void> => {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  await client.del(getTasksCacheKey(userId));
};
