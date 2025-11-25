# Alcovia Intervention Engine

A full-stack closed-loop system that detects when students are falling behind and automatically triggers a mentorship intervention workflow.

## System Overview

This system implements a **Human-in-the-Loop** architecture where:
1. **Student App** (React) - Real-time interface with focus tracking and state management
2. **Backend Server** (Node.js + PostgreSQL) - State machine managing student interventions
3. **Automation Workflow** (n8n) - Mentor notification and approval system
4. **Real-time Communication** (WebSockets) - Instant updates without polling

## Architecture

```
Student App (React)
    ↓ POST /daily-checkin
Backend (Node.js + PostgreSQL)
    ↓ Webhook (if failed)
n8n Workflow
    ↓ Email to Mentor
Mentor Clicks Approval Link
    ↓ Resume n8n workflow
    ↓ POST /assign-intervention
Backend Updates DB
    ↓ WebSocket emit
Student App Unlocks (Real-time)
```

## Database Schema

### Students Table
- `id` - Primary key
- `student_id` - Unique identifier
- `name` - Student name
- `email` - Contact email
- `status` - Current state: "On Track" | "Needs Intervention" | "Remedial Task"

### Daily Logs Table
- `id` - Primary key
- `student_id` - Foreign key
- `quiz_score` - Score out of 10
- `focus_minutes` - Time spent focusing
- `status` - Result of check-in
- `logged_at` - Timestamp

### Interventions Table
- `id` - Primary key
- `student_id` - Foreign key
- `task_description` - Remedial task assigned
- `mentor_notes` - Additional guidance
- `status` - "Pending" | "Completed"
- `assigned_at` - When task was assigned
- `completed_at` - When student completed it

## The Logic Gate

```javascript
if (quiz_score > 7 AND focus_minutes > 60) {
  status = "On Track"
} else {
  status = "Needs Intervention"
  trigger_n8n_webhook()
  lock_student_app()
}
```

## Setup Instructions

### Prerequisites
- Node.js 16+
- PostgreSQL database (or Supabase account)
- n8n account (cloud or self-hosted)

### Backend Setup

1. Navigate to server directory:
```bash
cd server
npm install
```

2. Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3001
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/student-intervention
FRONTEND_URL=http://localhost:3000
```

3. Initialize database:
```bash
psql -U your_user -d your_database -f database.sql
```

4. Start server:
```bash
npm start
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
npm install
```

2. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:3001
```

3. Start development server:
```bash
npm start
```

### n8n Workflow Setup

1. Import `n8n_workflow.json` into your n8n instance
2. Configure environment variables in n8n:
   - `BACKEND_URL` - Your backend API URL
   - `APPROVAL_URL` - URL for mentor approval webhook
3. Set up email credentials in the "Send Email to Mentor" node
4. Activate the workflow
5. Copy the webhook URL and update your backend `.env`

## Testing the Flow

### Test Case 1: Student Fails Check-in

1. Open the app at `http://localhost:3000`
2. Submit a check-in with:
   - Quiz Score: 4
   - Focus Minutes: 30
3. **Expected Result**: App enters "Locked State" showing "Waiting for Mentor..."

### Test Case 2: Mentor Intervention

1. Check your email for the intervention notification
2. Click "Assign Task: Read Chapter 4"
3. **Expected Result**: n8n workflow resumes and calls backend

### Test Case 3: Real-time Unlock (WebSocket)

1. After mentor assigns task, student app should unlock **instantly**
2. App shows "Remedial Task" with the assigned work
3. Student clicks "Mark Complete"
4. **Expected Result**: Status returns to "On Track"

### Test Case 4: Cheater Detection (Bonus)

1. Start the Focus Timer
2. Switch to another tab or minimize browser
3. **Expected Result**: Timer fails immediately with penalty message

## Fail-Safe Mechanism (System Design Answer)

### The Problem
If a mentor doesn't respond within 12 hours, the student remains locked out indefinitely.

### Proposed Solution: Multi-Tier Escalation System

#### Tier 1: Auto-Unlock (6 hours)
- After 6 hours of no mentor response, automatically assign a default remedial task
- Task: "Complete self-study module and retake quiz"
- Student can proceed with learning

#### Tier 2: Escalation (12 hours)
- If still no mentor action after 12 hours, escalate to Head Mentor
- Send urgent notification with student history
- Flag in dashboard as "Delayed Intervention"

#### Tier 3: Emergency Override (24 hours)
- After 24 hours, system automatically unlocks student
- Assigns comprehensive review task
- Logs incident for mentor performance review

#### Implementation Approach
```javascript
// In n8n workflow, add a parallel branch:
Wait Node (6 hours) → Auto-assign default task
Wait Node (12 hours) → Escalate to Head Mentor
Wait Node (24 hours) → Emergency unlock

// In database, add:
interventions.escalation_level (1, 2, 3)
interventions.auto_assigned (boolean)
```

#### Additional Safeguards
- **Grace Period**: Students get 1 "free pass" per week where they auto-unlock after 2 hours
- **Mentor SLA Tracking**: Monitor average response times, alert if > 4 hours
- **Student Communication**: Send app notification explaining delay and estimated unlock time
- **Async Learning**: While locked, allow access to read-only study materials

##  Bonus Features Implemented

### 1. Cheater Detection 
- Uses `visibilitychange` event to detect tab switching
- Automatically fails focus session if student switches tabs
- Logs penalty in the system

### 2. Real-Time WebSockets 
- Socket.io integration for instant updates
- Student app unlocks immediately when mentor assigns task
- No polling required - true real-time experience

##  Project Structure

```
alcovia-intervention-engine/
├── server/
│   ├── server.js          # Main Express server
│   ├── db.js              # Database connection
│   ├── database.sql       # Schema definition
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styling
│   │   ├── index.js       # Entry point
│   │   └── index.css      # Global styles
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env.example
├── n8n_workflow.json      # Importable workflow
└── README.md
```

##  Deployment Guide

### Backend (Railway/Render)

1. Create new project
2. Connect GitHub repository
3. Set environment variables
4. Deploy from `server` directory

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variable: `REACT_APP_API_URL`
5. Deploy

### Database (Supabase)

1. Create new project
2. Run SQL from `database.sql` in SQL Editor
3. Copy connection string to backend `.env`

### n8n (Cloud)

1. Sign up at n8n.cloud
2. Import workflow JSON
3. Configure credentials
4. Activate workflow

## API Endpoints

### GET /api/student/:studentId
Get student status and pending interventions

### POST /api/daily-checkin
Submit daily check-in
```json
{
  "student_id": "123",
  "quiz_score": 4,
  "focus_minutes": 30
}
```

### POST /api/assign-intervention
Assign remedial task (called by n8n)
```json
{
  "student_id": "123",
  "task_description": "Read Chapter 4",
  "mentor_notes": "Focus on examples"
}
```

### POST /api/complete-intervention
Mark task as complete
```json
{
  "student_id": "123",
  "intervention_id": 1
}
```

## Demo Video Script

1. **Intro** (30s): Show app in normal state, explain the system
2. **Failure Flow** (1m): Submit bad score, show lockout
3. **n8n Trigger** (1m): Show n8n execution, email received
4. **Mentor Action** (1m): Click approval link, show workflow resume
5. **Real-time Unlock** (1m): Show app unlock instantly via WebSocket
6. **Task Completion** (30s): Complete task, return to normal state

## Testing Checklist

- [ ] Student can submit successful check-in (score > 7, time > 60)
- [ ] Student can submit failed check-in (triggers intervention)
- [ ] App locks when intervention is triggered
- [ ] n8n webhook receives data correctly
- [ ] Email is sent to mentor
- [ ] Mentor approval link works
- [ ] Backend receives intervention assignment
- [ ] WebSocket updates student app in real-time
- [ ] Student can complete remedial task
- [ ] Status returns to "On Track" after completion
- [ ] Tab switching detection works
- [ ] Timer tracks focus time accurately

## Technical Decisions

### Why PostgreSQL over NoSQL?
- ACID compliance for critical state transitions
- Complex queries for intervention analytics
- Referential integrity between students, logs, and interventions

### Why WebSockets over Polling?
- Instant updates improve UX
- Reduces server load (no constant polling)
- Demonstrates real-time architecture skills

### Why n8n over Custom Code?
- Visual workflow makes mentor process transparent
- Easy to modify intervention logic without code changes
- Built-in retry and error handling

## Contributing

This is a technical assessment project. For questions, contact the Alcovia team.

## License

MIT License - Built for Alcovia Full Stack Engineering Intern Assignment

---

**Built with for Alcovia** | Submission Deadline: 9pm, 24th November 2025
