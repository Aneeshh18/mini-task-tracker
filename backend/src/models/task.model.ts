import { HydratedDocument, Schema, Types, model } from "mongoose";

export type TaskStatus = "pending" | "completed";
export type TaskDocument = HydratedDocument<Task>;

export interface Task {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<Task>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true
    },
    dueDate: {
      type: Date
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ owner: 1, status: 1 });

export const TaskModel = model<Task>("Task", taskSchema);
