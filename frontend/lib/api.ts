const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "completed";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const request = async <T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  token?: string
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload as T;
};

export const signup = (name: string, email: string, password: string): Promise<AuthResponse> => {
  return request<AuthResponse>("/api/auth/signup", "POST", { name, email, password });
};

export const login = (email: string, password: string): Promise<AuthResponse> => {
  return request<AuthResponse>("/api/auth/login", "POST", { email, password });
};

export const fetchTasks = (token: string): Promise<{ tasks: Task[] }> => {
  return request<{ tasks: Task[] }>("/api/tasks", "GET", undefined, token);
};

export const createTask = (
  token: string,
  data: { title: string; description?: string; dueDate?: string }
): Promise<{ task: Task }> => {
  return request<{ task: Task }>("/api/tasks", "POST", data, token);
};

export const updateTask = (
  token: string,
  id: string,
  data: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>
): Promise<{ task: Task }> => {
  return request<{ task: Task }>(`/api/tasks/${id}`, "PUT", data, token);
};

export const deleteTask = (token: string, id: string): Promise<{ message: string }> => {
  return request<{ message: string }>(`/api/tasks/${id}`, "DELETE", undefined, token);
};
