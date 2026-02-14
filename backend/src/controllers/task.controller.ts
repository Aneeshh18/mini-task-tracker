import { Request, Response } from "express";
import { Types } from "mongoose";
import { ApiError } from "../middleware/error.middleware";
import { TaskModel } from "../models/task.model";
import { cacheTasks, getCachedTasks, invalidateTasksCache } from "../services/cache.service";
import { sendSuccess } from "../utils/response";

const getUserId = (req: Request): string => {
  return (req as Request & { user: { id: string } }).user.id;
};

export const getTasks = async (req: Request, res: Response): Promise<Response> => {
  const userId = getUserId(req);
  const cached = await getCachedTasks(userId);

  if (cached) {
    return sendSuccess(res, { tasks: cached });
  }

  const tasks = await TaskModel.find({ owner: userId }).sort({ createdAt: -1 });

  await cacheTasks(userId, tasks);

  return sendSuccess(res, { tasks });
};

export const createTask = async (req: Request, res: Response): Promise<Response> => {
  const userId = getUserId(req);
  const { title, description, dueDate, status } = req.body as {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: "pending" | "completed";
  };

  if (!title) {
    throw new ApiError("title is required", 400);
  }

  const task = await TaskModel.create({
    title,
    description,
    dueDate,
    status,
    owner: userId
  });

  await invalidateTasksCache(userId);

  return sendSuccess(res, { task }, 201);
};

export const updateTask = async (req: Request, res: Response): Promise<Response> => {
  const userId = getUserId(req);
  const id = String(req.params.id);

  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError("Invalid task id", 400);
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: id, owner: userId },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!task) {
    throw new ApiError("Task not found", 404);
  }

  await invalidateTasksCache(userId);

  return sendSuccess(res, { task });
};

export const deleteTask = async (req: Request, res: Response): Promise<Response> => {
  const userId = getUserId(req);
  const id = String(req.params.id);

  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError("Invalid task id", 400);
  }

  const task = await TaskModel.findOneAndDelete({ _id: id, owner: userId });

  if (!task) {
    throw new ApiError("Task not found", 404);
  }

  await invalidateTasksCache(userId);

  return sendSuccess(res, { message: "Task deleted" });
};
