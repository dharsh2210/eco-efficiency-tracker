const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const Alert = require('../models/Alert');
const Ticket = require('../models/Ticket');
const { protect, officerOnly } = require('../middleware/auth');
const { ROLE_TO_DOMAIN, DOMAIN_ASSIGNEE } = require('../config/roles');

// Auto trend check — runs after each new entry is saved
async function checkTrends(newEntry) {
  try {
    const today = new Date();
    const oneWeekAgo  = new Date(today); oneWeekAgo.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);

    const toStr = (d) => d.toISOString().split('T')[0];

    const [currEntries, prevEntries] = await Promise.all([
      Entry.find({ type: newEntry.type, date: { $gt: toStr(oneWeekAgo),  $lte: toStr(today) } }),
      Entry.find({ type: newEntry.type, date: { $gt: toStr(twoWeeksAgo), $lte: toStr(oneWeekAgo) } }),
    ]);

    const curr = currEntries.reduce((s, e) => s + e.value, 0);
    const prev = prevEntries.reduce((s, e) => s + e.value, 0);

    console.log(`[Trend] ${newEntry.type}: curr=${curr.toFixed(0)} ${newEntry.unit}, prev=${prev.toFixed(0)} ${newEntry.unit}`);

    if (prev > 0 && curr > prev) {
      const pct = ((curr - prev) / prev) * 100;
      if (pct >= 10) {
        const severity = pct > 20 ? 'HIGH' : 'MEDIUM';
        console.log(`[Trend] Spike ${pct.toFixed(1)}% — creating alert + ticket (${severity})`);

        const alert = await Alert.create({
          domain:   newEntry.type,
          title:    'Consumption Spike Detected',
          message:  `This week's ${newEntry.type} usage (${curr.toFixed(0)} ${newEntry.unit}) is ${pct.toFixed(1)}% higher than last week (${prev.toFixed(0)} ${newEntry.unit}).`,
          location: 'Campus Wide',
          source:   'SYSTEM',
          severity,
        });

        await Ticket.create({
          title:       alert.title,
          description: alert.message,
          status:      'PENDING',
          priority:    severity,
          assignedTo:  DOMAIN_ASSIGNEE[newEntry.type],
          domain:      newEntry.type,
          deadline:    new Date(Date.now() + 72 * 60 * 60 * 1000),
          logs: [{ message: `Auto-generated: ${pct.toFixed(1)}% spike detected.`, user: 'SYSTEM' }],
        });
      }
    }
  } catch (err) {
    console.error('[Trend] Error:', err.message);
  }
}

// GET /api/entries
router.get('/', protect, async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 200 } = req.query;
    const q = {};
    if (req.user.role !== 'OFFICER') {
      const domain = ROLE_TO_DOMAIN[req.user.role];
      if (domain) q.type = domain;
    } else if (type) {
      q.type = type;
    }
    if (startDate || endDate) {
      q.date = {};
      if (startDate) q.date.$gte = startDate;
      if (endDate)   q.date.$lte = endDate;
    }
    const entries = await Entry.find(q).sort({ date: -1, createdAt: -1 }).limit(parseInt(limit));
    res.json(entries);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/entries/stats — aggregated from real DB, scoped to role
router.get('/stats', protect, async (req, res) => {
  try {
    const domainFilter = req.user.role !== 'OFFICER' ? ROLE_TO_DOMAIN[req.user.role] : null;
    const matchDomain  = domainFilter ? [{ $match: { type: domainFilter } }] : [];

    const now   = new Date();
    const ago7  = new Date(now); ago7.setDate(now.getDate() - 6);
    const ago28 = new Date(now); ago28.setDate(now.getDate() - 27);
    const toStr = (d) => d.toISOString().split('T')[0];

    const [stats, weekly, monthly, byLocation] = await Promise.all([
      Entry.aggregate([
        ...matchDomain,
        { $group: { _id: '$type', total: { $sum: '$value' }, count: { $sum: 1 }, avg: { $avg: '$value' }, max: { $max: '$value' }, min: { $min: '$value' } } }
      ]),
      Entry.aggregate([
        ...matchDomain,
        { $match: { date: { $gte: toStr(ago7) } } },
        { $group: { _id: { date: '$date', type: '$type' }, value: { $sum: '$value' } } },
        { $sort: { '_id.date': 1 } }
      ]),
      Entry.aggregate([
        ...matchDomain,
        { $match: { date: { $gte: toStr(ago28) } } },
        { $group: { _id: { date: '$date', type: '$type' }, value: { $sum: '$value' } } },
        { $sort: { '_id.date': 1 } }
      ]),
      Entry.aggregate([
        ...matchDomain,
        { $group: { _id: { location: '$location', type: '$type' }, value: { $sum: '$value' } } }
      ]),
    ]);

    res.json({ stats, weekly, monthly, byLocation });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/entries — Officer only
router.post('/', protect, officerOnly, async (req, res) => {
  try {
    const { type, value, unit, date, location } = req.body;
    if (!type || !value || !location || !date)
      return res.status(400).json({ message: 'All fields required' });

    const entry = await Entry.create({
      type, value: parseFloat(value), unit, date, location,
      enteredBy: req.user.name, enteredById: req.user._id,
    });

    // Run trend check async — don't block response
    checkTrends(entry);

    res.status(201).json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/entries/:id — Officer only
router.delete('/:id', protect, officerOnly, async (req, res) => {
  await Entry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
