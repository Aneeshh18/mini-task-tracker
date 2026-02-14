"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Task,
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  const loadTasks = async (authToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchTasks(authToken);
      setTasks(response.tasks);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load tasks";
      setError(message);

      if (message.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        router.replace("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      router.replace("/auth");
      return;
    }

    setToken(storedToken);
    void loadTasks(storedToken);
  }, [router]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setEditingTaskId("");
  };

  const submitTask = async () => {
    if (!token || !title.trim()) return;

    try {
      if (!editingTaskId) {
        await createTask(token, {
          title,
          description,
          dueDate: dueDate || undefined,
        });
      } else {
        await updateTask(token, editingTaskId, {
          title,
          description,
          dueDate: dueDate || undefined,
        });
      }

      resetForm();
      await loadTasks(token);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Task save failed",
      );
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
  };

  const onDeleteTask = async (id: string) => {
    if (!token) return;

    try {
      await deleteTask(token, id);
      await loadTasks(token);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
    }
  };

  const onToggleStatus = async (task: Task) => {
    if (!token) return;

    try {
      setError("");
      setUpdatingTaskId(task._id);
      const response = await updateTask(token, task._id, {
        status: task.status === "pending" ? "completed" : "pending",
      });
      setTasks((previousTasks) =>
        previousTasks.map((existingTask) =>
          existingTask._id === task._id ? response.task : existingTask,
        ),
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Status update failed",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  return (
    <main className="container">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="headerBar">
        <div>
          <h1>Task Dashboard</h1>
          <p className="headerSubtext">Manage and organize your daily tasks</p>
        </div>
        <button
          className="button secondary logoutButton"
          onClick={logout}
          type="button"
        >
          Logout
        </button>
      </div>

      {/* ── Create / Edit Form ─────────────────────────── */}
      <section className="card form">
        <h2>{editingTaskId ? "Edit task" : "New task"}</h2>

        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add some details..."
            rows={3}
          />
        </label>

        <label>
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>

        <div className="row">
          <button className="button" onClick={submitTask} type="button">
            {editingTaskId ? "Save changes" : "＋ Add task"}
          </button>
          {editingTaskId && (
            <button
              className="button secondary"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      {/* ── Task List ──────────────────────────────────── */}
      <section className="card">
        <div className="filterBar">
          <div className="row">
            <h2>Your tasks</h2>
            <span className="taskCount">{filteredTasks.length}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "pending" | "completed",
              )
            }
          >
            <option value="all">All tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading && <p className="loadingText">Loading your tasks...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && filteredTasks.length === 0 && (
          <div className="emptyState">
            <span className="emptyIcon">📋</span>
            <p>
              {statusFilter === "all"
                ? "No tasks yet. Create one above!"
                : `No ${statusFilter} tasks found.`}
            </p>
          </div>
        )}

        <ul className="taskList">
          {filteredTasks.map((task) => (
            <li key={task._id} className="taskItem">
              <div>
                <strong>{task.title}</strong>
                <p>{task.description || "No description"}</p>
                <small>
                  <span className={`statusBadge ${task.status}`}>
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span className="dueBadge">
                      {task.dueDate.slice(0, 10)}
                    </span>
                  )}
                </small>
              </div>

              <div className="row">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => onToggleStatus(task)}
                  disabled={updatingTaskId === task._id}
                >
                  {task.status === "pending" ? "✓ Done" : "↩ Undo"}
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() => onDeleteTask(task._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
