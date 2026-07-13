const express = require('express');
const router = express.Router();
const { createAuthToken, requireAuth } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = {
    id: `user_${Date.now()}`,
    email,
    role: role || 'customer',
    entityName: email.split('@')[0]
  };

  const token = createAuthToken({ sub: user.id, role: user.role, email: user.email });
  res.json({ user, token });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
