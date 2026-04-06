const mongoose = require('mongoose');
const logSchema = new mongoose.Schema({ timestamp: { type: Date, default: Date.now }, message: String, user: String });
const schema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  status:         { type: String, enum: ['PENDING','IN_PROGRESS','COMPLETED','OVERDUE'], default: 'PENDING' },
  priority:       { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
  assignedTo:     { type: String, required: true },
  domain:         { type: String, required: true, enum: ['ELECTRICITY','WATER','WASTE'] },
  deadline:       { type: Date, required: true },
  escalationLevel:{ type: Number, default: 0 },
  logs:           [logSchema]
}, { timestamps: true });
module.exports = mongoose.model('Ticket', schema);
