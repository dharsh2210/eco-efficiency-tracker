const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  domain:   { type: String, required: true, enum: ['ELECTRICITY','WATER','WASTE'] },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  location: { type: String, required: true },
  source:   { type: String, enum: ['SYSTEM','MANUAL','SENSOR'], default: 'SYSTEM' },
  severity: { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Alert', schema);
