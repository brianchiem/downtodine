const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const router = express.Router();

// GET /api/friend-requests -> { incoming: [], outgoing: [] }
router.get('/', auth, async (req, res) => {
  try {
    const meId = req.user.sub;
    const incoming = await FriendRequest.find({ to: meId, status: 'pending' })
      .populate('from', 'username email')
      .lean();
    const outgoing = await FriendRequest.find({ from: meId, status: 'pending' })
      .populate('to', 'username email')
      .lean();

    res.json({
      incoming: incoming.map((r) => ({ id: r._id.toString(), from: { id: r.from._id.toString(), username: r.from.username, email: r.from.email }, createdAt: r.createdAt })),
      outgoing: outgoing.map((r) => ({ id: r._id.toString(), to: { id: r.to._id.toString(), username: r.to.username, email: r.to.email }, createdAt: r.createdAt })),
    });
  } catch (e) {
    console.error('[friend-requests] GET / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friend-requests { toUsername }
router.post('/', auth, async (req, res) => {
  try {
    const meId = req.user.sub;
    const { toUsername } = req.body || {};
    if (!toUsername) return res.status(400).json({ message: 'toUsername is required' });

    const toUser = await User.findOne({ username: toUsername });
    if (!toUser) return res.status(404).json({ message: 'User not found' });
    if (toUser._id.equals(meId)) return res.status(400).json({ message: 'Cannot send request to yourself' });

    // Already friends?
    const me = await User.findById(meId);
    if (me.friends?.some((fid) => fid.equals(toUser._id))) {
      return res.status(409).json({ message: 'Already friends' });
    }

    // If there is a pending incoming request from them, auto-accept (mutual)
    const reciprocal = await FriendRequest.findOne({ from: toUser._id, to: meId, status: 'pending' });
    if (reciprocal) {
      // accept reciprocal
      await User.updateOne({ _id: meId }, { $addToSet: { friends: toUser._id } });
      await User.updateOne({ _id: toUser._id }, { $addToSet: { friends: meId } });
      reciprocal.status = 'accepted';
      await reciprocal.save();
      return res.status(201).json({ autoAccepted: true });
    }

    // Create new pending request (unique index prevents dupes)
    await FriendRequest.create({ from: meId, to: toUser._id, status: 'pending' });
    res.status(201).json({ ok: true });
  } catch (e) {
    // Handle duplicate key nicely
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Request already pending' });
    }
    console.error('[friend-requests] POST / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friend-requests/:id/accept
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const meId = req.user.sub;
    const reqDoc = await FriendRequest.findById(req.params.id);
    if (!reqDoc || reqDoc.status !== 'pending') return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.to.toString() !== meId) return res.status(403).json({ message: 'Not authorized' });

    // Add mutual friendship
    await User.updateOne({ _id: meId }, { $addToSet: { friends: reqDoc.from } });
    await User.updateOne({ _id: reqDoc.from }, { $addToSet: { friends: meId } });

    reqDoc.status = 'accepted';
    await reqDoc.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('[friend-requests] POST /:id/accept error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friend-requests/:id/decline
router.post('/:id/decline', auth, async (req, res) => {
  try {
    const meId = req.user.sub;
    const reqDoc = await FriendRequest.findById(req.params.id);
    if (!reqDoc || reqDoc.status !== 'pending') return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.to.toString() !== meId) return res.status(403).json({ message: 'Not authorized' });

    reqDoc.status = 'declined';
    await reqDoc.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('[friend-requests] POST /:id/decline error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
