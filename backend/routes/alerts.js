const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Ticket = require('../models/Ticket');
const { protect, officerOnly } = require('../middleware/auth');
const { ROLE_TO_DOMAIN, DOMAIN_ASSIGNEE } = require('../config/roles');

router.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.user.role !== 'OFFICER') {
      const domain = ROLE_TO_DOMAIN[req.user.role];
      if (domain) q.domain = domain;
    }
    const alerts = await Alert.find(q).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    let { domain, location, description } = req.body;
    if (!domain || !location || !description) return res.status(400).json({ message: 'All fields required' });
    // Always enforce domain based on role for non-officers
    if (req.user.role !== 'OFFICER') {
      const forced = ROLE_TO_DOMAIN[req.user.role];
      if (forced) domain = forced;
    }
    const alert = await Alert.create({ domain, title: `Manual Report: ${domain}`, message: description, location, source: 'MANUAL', severity: 'MEDIUM' });
    await Ticket.create({
      title: alert.title, description: alert.message,
      status: 'PENDING', priority: 'MEDIUM',
      assignedTo: DOMAIN_ASSIGNEE[domain], domain,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      logs: [{ message: 'Created from manual report.', user: req.user.name }]
    });
    res.status(201).json(alert);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, officerOnly, async (req, res) => {
  await Alert.findByIdAndDelete(req.params.id);
  res.json({ message: 'Alert deleted' });
});

module.exports = router;
