import { create } from 'zustand';
import type { Task, TaskListItem, ActionInfo, ValidationResult } from '../api/types';
import { taskApi } from '../api/client';

interface TaskState {
  tasks: TaskListItem[];
  actions: ActionInfo[];
  currentTask: Task | null;
  validation: ValidationResult | null;
  loading: boolean;

  fetchTasks: () => Promise<void>;
  fetchActions: () => Promise<void>;
  fetchTask: (filename: string) => Promise<void>;
  saveTask: (task: Task, filename?: string) => Promise<string>;
  deleteTask: (filename: string) => Promise<void>;
  validateTask: (filename: string) => Promise<ValidationResult>;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  actions: [],
  currentTask: null,
  validation: null,
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    const tasks = await taskApi.list();
    set({ tasks, loading: false });
  },

  fetchActions: async () => {
    const actions = await taskApi.actions();
    set({ actions });
  },

  fetchTask: async (filename: string) => {
    set({ loading: true, validation: null });
    const task = await taskApi.get(filename);
    set({ currentTask: task, loading: false });
  },

  saveTask: async (task: Task, filename?: string) => {
    if (filename) {
      await taskApi.update(filename, task);
      return filename;
    } else {
      const res = await taskApi.create(task);
      return res.filename;
    }
  },

  deleteTask: async (filename: string) => {
    await taskApi.delete(filename);
    set((state) => ({
      tasks: state.tasks.filter(t => t.filename !== filename),
    }));
  },

  validateTask: async (filename: string) => {
    const result = await taskApi.validate(filename);
    set({ validation: result });
    return result;
  },

  setCurrentTask: (task) => set({ currentTask: task, validation: null }),
}));
