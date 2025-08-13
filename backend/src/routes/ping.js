const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Protected: GET /api/ping
router.get('/', auth, (req, res) => {
  const payload = { ok: true, time: new Date().toISOString(), user: req.user?.sub };
  console.log('[ping] /api/ping', payload);
  res.json(payload);
});

module.exports = router;
