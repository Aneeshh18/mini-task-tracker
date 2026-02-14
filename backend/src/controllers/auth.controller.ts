import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { ApiError } from "../middleware/error.middleware";
import { signToken } from "../utils/jwt";
import { sendSuccess } from "../utils/response";

export const signup = async (req: Request, res: Response): Promise<Response> => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    throw new ApiError("name, email and password are required", 400);
  }

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError("Email already registered", 409);
  }

  const user = await UserModel.create({ name, email, password });

  const token = signToken(user.id);

  return sendSuccess(
    res,
    {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    },
    201
  );
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    throw new ApiError("email and password are required", 400);
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError("Invalid credentials", 401);
  }

  const token = signToken(user.id);

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
};
