'use strict';

const crypto = require('crypto');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const parts = authHeader.split(' ');
  const provided = parts.length === 2 && parts[0].toLowerCase() === 'bearer'
    ? parts[1]
    : null;
  const expected = process.env.WEBHOOK_SECRET || '';

  let valid = false;
  if (provided) {
    try {
      // timingSafeEqual requires same-length buffers; pad to avoid length leak
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      if (a.length === b.length) {
        valid = crypto.timingSafeEqual(a, b);
      }
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = requireAuth;
