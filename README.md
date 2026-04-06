# Eco-Efficiency Tracker — Full Stack

React + Node/Express + MongoDB campus resource management system.

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # edit MONGO_URI and JWT_SECRET
node seed.js             # seed database
npm run dev              # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                # http://localhost:3000
```

## Login Credentials

| Role                  | Email                   | Password  |
|-----------------------|-------------------------|-----------|
| Sustainability Officer| john@campus.edu         | admin123  |
| Powerplant Operator   | sarah@energy.edu        | pass123   |
| Energy Technician     | mike@energy.edu         | pass123   |
| NMC Member            | alex@energy.edu         | pass123   |
| Water Treatment       | dr@water.edu            | pass123   |
| Plumbing Specialist   | tom@water.edu           | pass123   |
| Irrigation Manager    | irr@water.edu           | pass123   |
| Waste Manager         | manager@waste.edu       | pass123   |
| Recycling Coordinator | recycle@waste.edu       | pass123   |
| Sanitation Officer    | sanitation@waste.edu    | pass123   |

## Role-Based Access

| Layer       | Roles                                           | Sees                                      |
|-------------|--------------------------------------------------|-------------------------------------------|
| STRATEGIC   | Officer, NMC Member, Irrigation Mgr, Waste Mgr  | Charts & stats for their domain only       |
| OPERATIONAL | Powerplant Op, Water Treatment, Recycling Coord | Department control panel + domain stats    |
| FIELD       | Energy Tech, Plumbing Spec, Sanitation Officer  | Only their assigned tickets + their system |

## Architecture
- Backend enforces domain at DB query level
- Tickets: field roles get only `{ assignedTo: role }` — not all domain tickets
- Alerts: non-officers get only `{ domain: their_domain }`
- Stats: aggregated via MongoDB pipeline filtered by role
- AI Insights: Claude AI generates recommendations from real consumption data
- Trend detection: auto-generates alert + ticket if spike >= 10% week-over-week
