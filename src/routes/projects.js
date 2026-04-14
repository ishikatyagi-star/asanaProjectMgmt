'use strict';

const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const asana = require('../lib/asana');

const router = Router();
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { name, workspace } = req.body || {};
    if (!name || !workspace) {
      return res.status(400).json({ error: 'name and workspace are required' });
    }
    const data = await asana.createProject(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tasks', async (req, res, next) => {
  try {
    const data = await asana.getProjectTasks(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
