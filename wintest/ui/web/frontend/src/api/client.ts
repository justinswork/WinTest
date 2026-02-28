import axios from 'axios';
import type { Task, TaskListItem, ActionInfo, ValidationResult, ReportSummary, ReportData, RunResponse, RunStatus } from './types';

const api = axios.create({ baseURL: '/api' });

export const taskApi = {
  list: () => api.get<TaskListItem[]>('/tasks').then(r => r.data),
  get: (filename: string) => api.get<Task>(`/tasks/${filename}`).then(r => r.data),
  create: (task: Task) => api.post('/tasks', task).then(r => r.data),
  update: (filename: string, task: Task) => api.put(`/tasks/${filename}`, task).then(r => r.data),
  delete: (filename: string) => api.delete(`/tasks/${filename}`).then(r => r.data),
  validate: (filename: string) => api.post<ValidationResult>(`/tasks/${filename}/validate`).then(r => r.data),
  actions: () => api.get<ActionInfo[]>('/tasks/actions').then(r => r.data),
};

export const executionApi = {
  run: (taskFile: string) => api.post<RunResponse>('/execution/run', { task_file: taskFile }).then(r => r.data),
  status: () => api.get<RunStatus>('/execution/status').then(r => r.data),
  modelStatus: () => api.get<{ status: string }>('/execution/model-status').then(r => r.data),
  loadModel: () => api.post('/execution/load-model').then(r => r.data),
};

export const reportApi = {
  list: () => api.get<ReportSummary[]>('/reports').then(r => r.data),
  get: (id: string) => api.get<ReportData>(`/reports/${id}`).then(r => r.data),
  delete: (id: string) => api.delete(`/reports/${id}`).then(r => r.data),
  screenshotUrl: (id: string, filename: string) => `/api/reports/${id}/screenshots/${filename}`,
};
