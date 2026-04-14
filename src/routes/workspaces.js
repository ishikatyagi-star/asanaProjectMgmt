'use strict';

const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const asana = require('../lib/asana');

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const data = await asana.getWorkspaces();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/projects', async (req, res, next) => {
  try {
    const data = await asana.getWorkspaceProjects(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/users', async (req, res, next) => {
  try {
    const data = await asana.getWorkspaceUsers(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
