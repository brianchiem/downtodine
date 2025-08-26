const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

const router = express.Router();

// List groups where current user is a member
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const groups = await Group.find({ members: userId })
      .select('name owner members createdAt updatedAt')
      .populate('owner', 'username email')
      .lean();
    res.json({ groups: groups.map(g => ({
      id: g._id.toString(),
      name: g.name,
      owner: g.owner ? { id: g.owner._id?.toString?.() || g.owner.id?.toString?.(), username: g.owner.username, email: g.owner.email } : null,
      membersCount: (g.members || []).length,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })) });
  } catch (e) {
    console.error('[groups] GET / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a group; owner becomes a member automatically
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const group = await Group.create({ name, owner: userId, members: [userId] });
    res.status(201).json({ id: group._id.toString(), name: group.name });
  } catch (e) {
    console.error('[groups] POST / error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Group detail with members list
router.get('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const group = await Group.findById(id).populate('owner', 'username email').populate('members', 'username email').lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const meId = req.user.sub;
    const isMember = (group.members || []).some(m => m._id.toString() === meId);
    if (!isMember) return res.status(403).json({ message: 'Not a member' });

    res.json({
      id: group._id.toString(),
      name: group.name,
      owner: group.owner ? { id: group.owner._id.toString(), username: group.owner.username, email: group.owner.email } : null,
      members: (group.members || []).map(m => ({ id: m._id.toString(), username: m.username, email: m.email })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  } catch (e) {
    console.error('[groups] GET /:id error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a group (open join for MVP)
router.post('/:id/join', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.sub;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.map(m => m.toString()).includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json({ message: 'Joined' });
  } catch (e) {
    console.error('[groups] POST /:id/join error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.sub;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();
    res.json({ message: 'Left' });
  } catch (e) {
    console.error('[groups] POST /:id/leave error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
