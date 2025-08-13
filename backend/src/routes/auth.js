const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('username').isLength({ min: 3 }).withMessage('Username at least 3 chars'),
    body('password').isLength({ min: 6 }).withMessage('Password at least 6 chars'),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('emailOrUsername').isString().notEmpty().withMessage('Email or Username required'),
    body('password').isString().notEmpty().withMessage('Password required'),
  ],
  authController.login
);

module.exports = router;

// Protected: GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('_id email username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, email: user.email, username: user.username });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});
