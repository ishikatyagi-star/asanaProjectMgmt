'use strict';

const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const asana = require('../lib/asana');

const router = Router();
router.use(requireAuth);

// Only these fields are forwarded to Asana on PATCH to prevent GPT-hallucinated
// fields from triggering Asana 400 errors.
const ALLOWED_UPDATE_FIELDS = ['name', 'assignee', 'due_on', 'notes', 'completed'];

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const data = await asana.createTask(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const filtered = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        filtered[field] = req.body[field];
      }
    }
    if (Object.keys(filtered).length === 0) {
      return res.status(400).json({
        error: `At least one of [${ALLOWED_UPDATE_FIELDS.join(', ')}] is required`,
      });
    }
    const data = await asana.updateTask(req.params.id, filtered);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/addProject', async (req, res, next) => {
  try {
    const { project } = req.body || {};
    if (!project) {
      return res.status(400).json({ error: 'project is required' });
    }
    const data = await asana.addTaskToProject(req.params.id, req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
