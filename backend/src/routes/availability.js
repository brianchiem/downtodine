const express = require('express');
const auth = require('../middleware/auth');
const Availability = require('../models/Availability');
const User = require('../models/User');

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

// Specific user's availability with overlap for today
router.get('/user/:userId/today', auth, async (req, res) => {
  try {
    const date = todayUtc();
    const { userId } = req.params;
    // my hours
    const mine = await Availability.findOne({ user: req.user.sub, date }).lean();
    const myHours = Array.isArray(mine?.hours) ? mine.hours : [];
    const mySet = new Set(myHours);

    // friend's hours
    const doc = await Availability.findOne({ user: userId, date }).populate('user', 'username email').lean();
    const friendHours = Array.isArray(doc?.hours) ? doc.hours : [];
    const overlap = friendHours.filter((h) => mySet.has(h));
    const friend = doc?.user || { _id: userId };
    res.json({ date, myHours, friend: { userId: friend._id?.toString?.() || String(userId), username: friend.username || 'Unknown' }, hours: friendHours, overlap, overlapCount: overlap.length });
  } catch (e) {
    console.error('[availability] GET /user/:userId/today error', e);
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

// Friends' availability with overlap for today
router.get('/friends/today', auth, async (req, res) => {
  try {
    const date = todayUtc();
    const me = await User.findById(req.user.sub).lean();
    const friendIds = (me?.friends || []).map((id) => id.toString());
    console.log('[availability] GET /friends/today', { user: req.user.sub, date, friends: friendIds.length });

    // Get my availability first
    const mine = await Availability.findOne({ user: req.user.sub, date }).lean();
    const myHours = Array.isArray(mine?.hours) ? mine.hours : [];
    const mySet = new Set(myHours);

    if (friendIds.length === 0) {
      return res.json({ date, friends: [], myHours });
    }

    // Fetch friends' availability for today
    const docs = await Availability.find({ user: { $in: friendIds }, date })
      .populate('user', 'username email')
      .lean();

    const results = docs.map((doc) => {
      const hours = Array.isArray(doc.hours) ? doc.hours : [];
      const overlap = hours.filter((h) => mySet.has(h));
      return {
        userId: doc.user?._id?.toString?.() || doc.user?.toString?.() || String(doc.user),
        username: doc.user?.username || 'Unknown',
        hours,
        overlap,
        overlapCount: overlap.length,
      };
    });

    // Sort by highest overlap desc, then username asc
    results.sort((a, b) => (b.overlapCount - a.overlapCount) || (a.username || '').localeCompare(b.username || ''));

    res.json({ date, myHours, friends: results });
  } catch (e) {
    console.error('[availability] GET /friends/today error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
