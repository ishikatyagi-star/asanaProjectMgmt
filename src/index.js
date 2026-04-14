'use strict';

require('dotenv').config();

const express = require('express');

const workspacesRouter = require('./routes/workspaces');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');

const app = express();

app.use(express.json());

// Health check — no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Asana proxy routes (auth enforced per-router)
app.use('/workspaces', workspacesRouter);
app.use('/projects', projectsRouter);
app.use('/tasks', tasksRouter);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.asanaStatus || 500;
  const body = { error: err.message || 'Internal server error' };
  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }
  res.status(status).json(body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
