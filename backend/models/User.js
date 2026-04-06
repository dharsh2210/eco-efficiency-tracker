const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 4 },
  role: {
    type: String, required: true,
    enum: [
      'OFFICER',
      'ENERGY_TECHNICIAN', 'NMC_MEMBER',
      'PLUMBING_SPECIALIST', 'IRRIGATION_MANAGER',
      'SANITATION_OFFICER', 'WASTE_MANAGER'
    ]
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

schema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
schema.methods.matchPassword = function(p) { return bcrypt.compare(p, this.password); };
schema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('User', schema);
