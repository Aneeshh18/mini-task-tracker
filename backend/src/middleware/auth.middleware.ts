import { NextFunction, Request, Response } from "express";
import { ApiError } from "./error.middleware";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new ApiError("Unauthorized", 401);
  }
  const payload = verifyToken(token);

  (req as Request & { user: { id: string } }).user = { id: payload.userId };

  next();
};
