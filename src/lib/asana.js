'use strict';

const axios = require('axios');

const client = axios.create({
  baseURL: 'https://app.asana.com/api/1.0',
  headers: {
    Authorization: `Bearer ${process.env.ASANA_PAT}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercept Asana errors and enrich them with the original HTTP status
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errors = error.response.data && error.response.data.errors;
      const message =
        (errors && errors[0] && errors[0].message) ||
        `Asana API error (${status})`;
      const enriched = new Error(message);
      enriched.asanaStatus = status;
      return Promise.reject(enriched);
    }
    // Network timeout or no response
    const enriched = new Error('Asana API unreachable');
    enriched.asanaStatus = 502;
    return Promise.reject(enriched);
  }
);

const BASE_FIELDS = 'gid,name,resource_type';

// ── Workspaces ──────────────────────────────────────────────────────────────

async function getWorkspaces() {
  const res = await client.get('/workspaces', {
    params: { opt_fields: BASE_FIELDS },
  });
  return res.data.data;
}

async function getWorkspaceProjects(workspaceId) {
  const res = await client.get(`/workspaces/${workspaceId}/projects`, {
    params: { opt_fields: `${BASE_FIELDS},color,archived` },
  });
  return res.data.data;
}

async function getWorkspaceUsers(workspaceId) {
  const res = await client.get(`/workspaces/${workspaceId}/users`, {
    params: { opt_fields: `${BASE_FIELDS},email` },
  });
  return res.data.data;
}

// ── Projects ─────────────────────────────────────────────────────────────────

async function createProject(body) {
  const res = await client.post('/projects', { data: body });
  return res.data.data;
}

async function getProjectTasks(projectId) {
  const res = await client.get(`/projects/${projectId}/tasks`, {
    params: { opt_fields: `${BASE_FIELDS},completed,due_on,assignee.name,notes` },
  });
  return res.data.data;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

async function createTask(body) {
  const res = await client.post('/tasks', { data: body });
  return res.data.data;
}

async function updateTask(taskId, body) {
  const res = await client.put(`/tasks/${taskId}`, { data: body });
  return res.data.data;
}

async function addTaskToProject(taskId, body) {
  const res = await client.post(`/tasks/${taskId}/addProject`, { data: body });
  // addProject returns an empty data object on success
  return res.data.data;
}

module.exports = {
  getWorkspaces,
  getWorkspaceProjects,
  getWorkspaceUsers,
  createProject,
  getProjectTasks,
  createTask,
  updateTask,
  addTaskToProject,
};
