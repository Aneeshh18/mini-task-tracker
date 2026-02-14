import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.jwtSecret) as { userId: string };
};
