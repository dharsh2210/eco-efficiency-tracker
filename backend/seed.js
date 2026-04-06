require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User   = require('./models/User');
const Entry  = require('./models/Entry');
const Alert  = require('./models/Alert');
const Ticket = require('./models/Ticket');

// Only 7 roles — POWERPLANT_OPERATOR, RECYCLING_COORDINATOR, WATER_TREATMENT_MEMBER removed
const USERS = [
  { name: 'Officer John',       email: 'john@campus.edu',       role: 'OFFICER',             password: 'john@campus.edu'      },
  { name: 'Mike Tech',          email: 'mike@energy.edu',       role: 'ENERGY_TECHNICIAN',   password: 'mike@energy.edu'      },
  { name: 'Alex NMC',           email: 'alex@energy.edu',       role: 'NMC_MEMBER',          password: 'alex@energy.edu'      },
  { name: 'Tom Plumber',        email: 'tom@water.edu',         role: 'PLUMBING_SPECIALIST', password: 'tom@water.edu'        },
  { name: 'Irrigation Lead',    email: 'irr@water.edu',         role: 'IRRIGATION_MANAGER',  password: 'irr@water.edu'        },
  { name: 'Green Manager',      email: 'manager@waste.edu',     role: 'WASTE_MANAGER',       password: 'manager@waste.edu'    },
  { name: 'Sanitation Officer', email: 'sanitation@waste.edu',  role: 'SANITATION_OFFICER',  password: 'sanitation@waste.edu' },
];

function genEntries(officerName) {
  const now = new Date();
  const entries = [];
  const locs = {
    ELECTRICITY: ['Science Building', 'Admin Block', 'Library', 'Hostel A', 'Hostel B'],
    WATER:       ['Campus Dorms', 'Cafeteria', 'Sports Complex', 'Admin Block', 'Garden Zone'],
    WASTE:       ['Main Cafeteria', 'Science Block', 'Admin Block', 'Sports Complex'],
  };
  for (let d = 27; d >= 0; d--) {
    const dt = new Date(now); dt.setDate(dt.getDate() - d);
    const ds = dt.toISOString().split('T')[0];
    const wk = Math.floor(d / 7);
    if (d % 3 === 0) entries.push({ type: 'ELECTRICITY', value: Math.round(800 + (3 - wk) * 200 + Math.random() * 150), unit: 'kWh',    date: ds, location: locs.ELECTRICITY[d % 5], enteredBy: officerName });
    if (d % 2 === 0) entries.push({ type: 'WATER',       value: Math.round(3800 + (3 - wk) * 300 + Math.random() * 600), unit: 'Liters', date: ds, location: locs.WATER[d % 5],       enteredBy: officerName });
    if (d % 4 === 0) entries.push({ type: 'WASTE',       value: Math.round(180 + Math.random() * 80),                    unit: 'Kg',     date: ds, location: locs.WASTE[d % 4],       enteredBy: officerName });
  }
  return entries;
}

async function seed() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Entry.deleteMany({}), Alert.deleteMany({}), Ticket.deleteMany({})]);
  console.log('DB cleared');

  const hashed = await Promise.all(USERS.map(async u => ({ ...u, password: await bcrypt.hash(u.password, 10) })));
  await User.insertMany(hashed);
  console.log('7 users seeded');

  const entries = genEntries('Officer John');
  await Entry.insertMany(entries);
  console.log(`${entries.length} entries seeded`);

  await Alert.insertMany([
    { domain: 'ELECTRICITY', title: 'Consumption Spike Detected', message: 'This week electricity is 24% higher than last week.', location: 'Campus Wide', source: 'SYSTEM', severity: 'HIGH' },
    { domain: 'WATER',       title: 'Manual Report: WATER',       message: 'Leaking pipe near Hostel B.',                         location: 'Hostel B',    source: 'MANUAL', severity: 'MEDIUM' },
    { domain: 'WASTE',       title: 'Bin Overflow Alert',         message: 'Cafeteria bin fill exceeded 90%.',                   location: 'Cafeteria',   source: 'SENSOR', severity: 'MEDIUM' },
  ]);

  await Ticket.insertMany([
    { title: 'Inspect Solar Inverter 4',  description: 'Efficiency dropped 15% in 48h.',         status: 'PENDING',     priority: 'HIGH',     assignedTo: 'ENERGY_TECHNICIAN',  domain: 'ELECTRICITY', deadline: new Date(Date.now() + 3 * 86400000), escalationLevel: 0, logs: [{ message: 'Auto-generated.', user: 'SYSTEM' }] },
    { title: 'Fix Leak in Hostel B',      description: 'High-pressure zone. Students reported.', status: 'IN_PROGRESS', priority: 'CRITICAL', assignedTo: 'PLUMBING_SPECIALIST',domain: 'WATER',       deadline: new Date(Date.now() + 86400000),     escalationLevel: 1, logs: [{ message: 'Plumber dispatched.', user: 'Tom Plumber' }] },
    { title: 'Waste Segregation Audit',   description: 'Check cafeteria bin compliance.',        status: 'OVERDUE',     priority: 'MEDIUM',   assignedTo: 'SANITATION_OFFICER', domain: 'WASTE',       deadline: new Date(Date.now() - 3 * 86400000), escalationLevel: 0, logs: [{ message: 'Created.', user: 'SYSTEM' }] },
  ]);

  console.log('\nSeed complete!\n');
  console.log('Login credentials (password = email):');
  console.log('  OFFICER             john@campus.edu        john@campus.edu');
  console.log('  ENERGY_TECHNICIAN   mike@energy.edu        mike@energy.edu');
  console.log('  NMC_MEMBER          alex@energy.edu        alex@energy.edu');
  console.log('  PLUMBING_SPECIALIST tom@water.edu          tom@water.edu');
  console.log('  IRRIGATION_MANAGER  irr@water.edu          irr@water.edu');
  console.log('  WASTE_MANAGER       manager@waste.edu      manager@waste.edu');
  console.log('  SANITATION_OFFICER  sanitation@waste.edu   sanitation@waste.edu');

  mongoose.connection.close();
}

seed().catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
