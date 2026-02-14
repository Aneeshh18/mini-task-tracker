import { Router } from "express";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/task.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", asyncHandler(getTasks));
router.post("/", asyncHandler(createTask));
router.put("/:id", asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));

export default router;
