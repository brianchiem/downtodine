const express = require('express');
const auth = require('../middleware/auth');
const Availability = require('../models/Availability');

const router = express.Router();

function todayUtc() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// GET /api/availability/today -> { date, hours: number[] }
router.get('/today', auth, async (req, res) => {
  try {
    const date = todayUtc();
    console.log('[availability] GET /today', { user: req.user.sub, date });
    const existing = await Availability.findOne({ user: req.user.sub, date });
    res.json({ date, hours: existing?.hours || [] });
  } catch (e) {
    console.error('[availability] GET /today error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/availability/today -> set hours { hours: number[] }
router.post('/today', auth, async (req, res) => {
  try {
    const date = todayUtc();
    const hours = Array.isArray(req.body?.hours) ? req.body.hours : [];
    const normalized = [...new Set(hours.map((h) => parseInt(h, 10)))].filter(
      (h) => Number.isInteger(h) && h >= 0 && h <= 23
    );
    console.log('[availability] POST /today (set hours)', { user: req.user.sub, date, count: normalized.length });
    const doc = await Availability.findOneAndUpdate(
      { user: req.user.sub, date },
      { $set: { hours: normalized }, $setOnInsert: { user: req.user.sub, date } },
      { upsert: true, new: true }
    );
    console.log('[availability] set hours', { user: req.user.sub, date, hours: doc.hours });
    res.status(201).json({ date, hours: doc.hours });
  } catch (e) {
    console.error('[availability] POST /today error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/availability/today -> clear hours
router.delete('/today', auth, async (req, res) => {
  try {
    const date = todayUtc();
    console.log('[availability] DELETE /today (clear hours)', { user: req.user.sub, date });
    await Availability.findOneAndUpdate(
      { user: req.user.sub, date },
      { $set: { hours: [] }, $setOnInsert: { user: req.user.sub, date } },
      { upsert: true }
    );
    console.log('[availability] clear hours', { user: req.user.sub, date });
    res.json({ date, hours: [] });
  } catch (e) {
    console.error('[availability] DELETE /today error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
