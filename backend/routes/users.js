const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, officerOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const users = await User.find({ isActive: true }).select('-password').sort({ role: 1 });
  res.json(users);
});

router.post('/', protect, officerOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ name, email, password, role });
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', protect, officerOnly, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, isActive }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, officerOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
  res.json({ message: 'User deactivated', user });
});

module.exports = router;
