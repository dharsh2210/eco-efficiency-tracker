const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  type:        { type: String, required: true, enum: ['ELECTRICITY','WATER','WASTE'] },
  value:       { type: Number, required: true, min: 0 },
  unit:        { type: String, required: true },
  date:        { type: String, required: true },
  location:    { type: String, required: true, trim: true },
  enteredBy:   { type: String, required: true },
  enteredById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('Entry', schema);
