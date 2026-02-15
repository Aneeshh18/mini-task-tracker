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

type StatusFilter = "all" | "pending" | "completed";
type DueState = "none" | "overdue" | "today" | "soon";

const DAY_MS = 24 * 60 * 60 * 1000;

const toDay = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const getDueState = (task: Task): DueState => {
  if (!task.dueDate || task.status !== "pending") {
    return "none";
  }

  const parsed = new Date(task.dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return "none";
  }

  const today = toDay(new Date());
  const dueDay = toDay(parsed);

  if (dueDay.getTime() < today.getTime()) {
    return "overdue";
  }

  const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);

  if (dayDiff === 0) {
    return "today";
  }

  if (dayDiff > 0 && dayDiff <= 3) {
    return "soon";
  }

  return "none";
};

const getDueLabel = (task: Task): string => {
  if (!task.dueDate) {
    return "No due date";
  }

  const state = getDueState(task);

  if (state === "overdue") {
    return "Overdue";
  }

  if (state === "today") {
    return "Due today";
  }

  if (state === "soon") {
    return "Due soon";
  }

  return `Due ${task.dueDate.slice(0, 10)}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [savingTask, setSavingTask] = useState(false);

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
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const completed = tasks.filter(
      (task) => task.status === "completed",
    ).length;
    const overdue = tasks.filter(
      (task) => getDueState(task) === "overdue",
    ).length;
    const completion = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, pending, completed, overdue, completion };
  }, [tasks]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setEditingTaskId("");
  };

  const submitTask = async () => {
    if (!token || !title.trim()) {
      return;
    }

    setError("");
    setSavingTask(true);

    const trimmedTitle = title.trim();
    const draftDescription = description.trim();
    const draftDueDate = dueDate || undefined;

    if (!editingTaskId) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimisticTask: Task = {
        _id: tempId,
        title: trimmedTitle,
        description: draftDescription,
        status: "pending",
        dueDate: draftDueDate,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setTasks((previousTasks) => [optimisticTask, ...previousTasks]);
      resetForm();

      try {
        const response = await createTask(token, {
          title: trimmedTitle,
          description: draftDescription || undefined,
          dueDate: draftDueDate,
        });

        setTasks((previousTasks) =>
          previousTasks.map((task) =>
            task._id === tempId ? response.task : task,
          ),
        );
      } catch (submitError) {
        setTasks((previousTasks) =>
          previousTasks.filter((task) => task._id !== tempId),
        );
        setTitle(trimmedTitle);
        setDescription(draftDescription);
        setDueDate(dueDate);
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Task save failed",
        );
      } finally {
        setSavingTask(false);
      }

      return;
    }

    const previousTasks = [...tasks];
    const existingTask = tasks.find((task) => task._id === editingTaskId);

    if (!existingTask) {
      setSavingTask(false);
      return;
    }

    const optimisticTask: Task = {
      ...existingTask,
      title: trimmedTitle,
      description: draftDescription,
      dueDate: draftDueDate,
      updatedAt: new Date().toISOString(),
    };

    setTasks((previousTasksState) =>
      previousTasksState.map((task) =>
        task._id === editingTaskId ? optimisticTask : task,
      ),
    );
    resetForm();

    try {
      const response = await updateTask(token, editingTaskId, {
        title: trimmedTitle,
        description: draftDescription || undefined,
        dueDate: draftDueDate,
      });

      setTasks((previousTasksState) =>
        previousTasksState.map((task) =>
          task._id === editingTaskId ? response.task : task,
        ),
      );
    } catch (submitError) {
      setTasks(previousTasks);
      setEditingTaskId(existingTask._id);
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? "");
      setDueDate(existingTask.dueDate ? existingTask.dueDate.slice(0, 10) : "");
      setError(
        submitError instanceof Error ? submitError.message : "Task save failed",
      );
    } finally {
      setSavingTask(false);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
  };

  const onDeleteTask = async (id: string) => {
    if (!token) {
      return;
    }

    const previousTasks = [...tasks];

    setError("");
    setDeletingTaskId(id);
    setTasks((previousTasksState) =>
      previousTasksState.filter((task) => task._id !== id),
    );

    if (editingTaskId === id) {
      resetForm();
    }

    try {
      await deleteTask(token, id);
    } catch (deleteError) {
      setTasks(previousTasks);
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
    } finally {
      setDeletingTaskId("");
    }
  };

  const onToggleStatus = async (task: Task) => {
    if (!token) {
      return;
    }

    const nextStatus = task.status === "pending" ? "completed" : "pending";
    const previousTask = task;

    setError("");
    setUpdatingTaskId(task._id);
    setTasks((previousTasksState) =>
      previousTasksState.map((existingTask) =>
        existingTask._id === task._id
          ? {
              ...existingTask,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : existingTask,
      ),
    );

    try {
      const response = await updateTask(token, task._id, {
        status: nextStatus,
      });

      setTasks((previousTasksState) =>
        previousTasksState.map((existingTask) =>
          existingTask._id === task._id ? response.task : existingTask,
        ),
      );
    } catch (statusError) {
      setTasks((previousTasksState) =>
        previousTasksState.map((existingTask) =>
          existingTask._id === task._id ? previousTask : existingTask,
        ),
      );
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

      <section className="analyticsGrid">
        <article className="card statCard">
          <p className="statLabel">Total</p>
          <p className="statValue">{metrics.total}</p>
        </article>
        <article className="card statCard">
          <p className="statLabel">Pending</p>
          <p className="statValue">{metrics.pending}</p>
        </article>
        <article className="card statCard">
          <p className="statLabel">Completed</p>
          <p className="statValue">{metrics.completed}</p>
        </article>
        <article className="card statCard">
          <p className="statLabel">Overdue</p>
          <p className="statValue statValueDanger">{metrics.overdue}</p>
        </article>
        <article className="card statCard">
          <p className="statLabel">Completion</p>
          <p className="statValue">{metrics.completion}%</p>
        </article>
      </section>

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
          <button
            className="button"
            onClick={submitTask}
            type="button"
            disabled={savingTask}
          >
            {savingTask
              ? "Saving..."
              : editingTaskId
                ? "Save changes"
                : "Add task"}
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

      <section className="card">
        <div className="filterBar">
          <div className="row">
            <h2>Your tasks</h2>
            <span className="taskCount">{filteredTasks.length}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
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
            <span className="emptyIcon">No tasks</span>
            <p>
              {statusFilter === "all"
                ? "No tasks yet. Create one above."
                : `No ${statusFilter} tasks found.`}
            </p>
          </div>
        )}

        <ul className="taskList">
          {filteredTasks.map((task) => {
            const dueState = getDueState(task);

            return (
              <li
                key={task._id}
                className={`taskItem ${dueState === "overdue" ? "overdue" : ""}`.trim()}
              >
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.description || "No description"}</p>
                  <small>
                    <span className={`statusBadge ${task.status}`}>
                      {task.status}
                    </span>
                    <span className={`dueBadge ${dueState}`.trim()}>
                      {getDueLabel(task)}
                    </span>
                  </small>
                </div>

                <div className="row">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => startEdit(task)}
                    disabled={deletingTaskId === task._id}
                  >
                    Edit
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => onToggleStatus(task)}
                    disabled={
                      updatingTaskId === task._id || deletingTaskId === task._id
                    }
                  >
                    {task.status === "pending" ? "Mark done" : "Mark pending"}
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => onDeleteTask(task._id)}
                    disabled={deletingTaskId === task._id}
                  >
                    {deletingTaskId === task._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
