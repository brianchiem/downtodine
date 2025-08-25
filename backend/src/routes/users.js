const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const router = express.Router();

// GET /api/users/search?q=br&limit=10
router.get('/search', auth, async (req, res) => {
  try {
    const meId = req.user.sub;
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);
    if (!q || q.length < 2) return res.json({ users: [] });

    // case-insensitive prefix match on username
    const re = new RegExp('^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // fetch me to get friends list
    const me = await User.findById(meId).lean();
    const friendIdSet = new Set((me?.friends || []).map((id) => id.toString()));

    // pending requests involving me
    const pendings = await FriendRequest.find({ $or: [{ from: meId }, { to: meId }], status: 'pending' }).lean();
    const outgoingTo = new Set(pendings.filter((r) => r.from.toString() === meId).map((r) => r.to.toString()));
    const incomingFrom = new Set(pendings.filter((r) => r.to.toString() === meId).map((r) => r.from.toString()));

    const candidates = await User.find({ username: re }).select('username email').limit(limit + 5).lean();

    const results = [];
    for (const u of candidates) {
      const id = u._id.toString();
      if (id === meId) continue; // exclude self
      const alreadyFriend = friendIdSet.has(id);
      const pendingOutgoing = outgoingTo.has(id);
      const pendingIncoming = incomingFrom.has(id);
      results.push({ id, username: u.username, email: u.email, alreadyFriend, pendingOutgoing, pendingIncoming });
      if (results.length >= limit) break;
    }

    res.json({ users: results });
  } catch (e) {
    console.error('[users] GET /search error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
