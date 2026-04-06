const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect, officerOnly } = require('../middleware/auth');
const { ROLE_TO_DOMAIN, FIELD_ROLES } = require('../config/roles');

router.get('/', protect, async (req, res) => {
  try {
    const role = req.user.role;
    let q = {};
    if (role === 'OFFICER') {
      q = {};                                          // sees all
    } else if (FIELD_ROLES.includes(role)) {
      q = { assignedTo: role };                        // only tickets assigned to this exact role
    } else {
      const domain = ROLE_TO_DOMAIN[role];
      if (domain) q = { domain };                      // strategic/operational: all in domain
    }
    const tickets = await Ticket.find(q).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, logMessage } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.status = status;
    ticket.logs.push({ message: logMessage || `Status updated to ${status}`, user: req.user.name });
    await ticket.save();
    res.json(ticket);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, officerOnly, async (req, res) => {
  try {
    const { title, description, priority, assignedTo, domain, deadline } = req.body;
    const ticket = await Ticket.create({ title, description, priority, assignedTo, domain, deadline: new Date(deadline), logs: [{ message: 'Created by officer.', user: req.user.name }] });
    res.status(201).json(ticket);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
