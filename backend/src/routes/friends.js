const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/friends - list my friends
router.get('/', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.sub).populate('friends', 'username email').lean();
    const friends = (me?.friends || []).map((u) => ({ id: u._id.toString(), username: u.username, email: u.email }));
    res.json({ friends });
  } catch (e) {
    console.error('[friends] GET / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends - add friend by username (mutual add)
router.post('/', auth, async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ message: 'username is required' });
    const me = await User.findById(req.user.sub);
    const friend = await User.findOne({ username });
    if (!friend) return res.status(404).json({ message: 'User not found' });
    if (friend._id.equals(me._id)) return res.status(400).json({ message: 'Cannot add yourself' });

    await User.updateOne({ _id: me._id }, { $addToSet: { friends: friend._id } });
    await User.updateOne({ _id: friend._id }, { $addToSet: { friends: me._id } });

    const updated = await User.findById(me._id).populate('friends', 'username email').lean();
    const friends = (updated?.friends || []).map((u) => ({ id: u._id.toString(), username: u.username, email: u.email }));
    console.log('[friends] add', { me: me._id.toString(), friend: friend._id.toString() });
    res.status(201).json({ friends });
  } catch (e) {
    console.error('[friends] POST / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/friends/:friendId - remove friend (mutual remove)
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const meId = req.user.sub;
    await User.updateOne({ _id: meId }, { $pull: { friends: friendId } });
    await User.updateOne({ _id: friendId }, { $pull: { friends: meId } });

    const updated = await User.findById(meId).populate('friends', 'username email').lean();
    const friends = (updated?.friends || []).map((u) => ({ id: u._id.toString(), username: u.username, email: u.email }));
    console.log('[friends] remove', { me: meId, friend: friendId });
    res.json({ friends });
  } catch (e) {
    console.error('[friends] DELETE /:friendId error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
