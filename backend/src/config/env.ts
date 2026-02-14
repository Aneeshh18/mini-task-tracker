import dotenv from "dotenv";

dotenv.config({ quiet: true });

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 5000;
  }
  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/mini-tracker",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? "60")
};

export const isProduction = env.nodeEnv === "production";
