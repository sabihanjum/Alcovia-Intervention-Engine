# Alcovia Intervention Engine - Project Overview

## 🎯 What This Project Does

The Alcovia Intervention Engine is a **closed-loop system** that automatically detects when students are falling behind and triggers a human-mentored intervention workflow. It's a real-world example of **Human-in-the-Loop** architecture where technology and human judgment work together.

## 🏆 Key Features Implemented

### ✅ Problem 1: State of the Student Backend
- **SQL Database**: PostgreSQL with proper schema (students, daily_logs, interventions)
- **Logic Gate**: Evaluates performance (quiz_score > 7 AND focus_minutes > 60)
- **State Management**: Tracks student status (On Track, Needs Intervention, Remedial Task)
- **API Endpoints**: RESTful API for all operations

### ✅ Problem 2: Human-in-the-Loop Automation
- **n8n Workflow**: Visual automation that pauses for human input
- **Email Notification**: Alerts mentor when student fails
- **Wait Mechanism**: Workflow pauses until mentor approves
- **Loop Back**: Updates backend after mentor assigns task

### ✅ Problem 3: Focus Mode App
- **State-Based UI**: Different interfaces for each student state
- **Normal State**: Timer and check-in form
- **Locked State**: "Waiting for Mentor..." with spinner
- **Remedial State**: Shows assigned task with completion button
- **Real-time Updates**: Instant unlock without page refresh

### ✅ Chaos Component: Fail-Safe Mechanism
Comprehensive multi-tier escalation system:
- **6 hours**: Auto-assign default remedial task
- **12 hours**: Escalate to Head Mentor
- **24 hours**: Emergency unlock with comprehensive review
- **Grace Period**: 1 free pass per week for students
- **Async Learning**: Read-only materials available while locked

### 🌟 Bonus 1: Cheater Detection
- **Tab Visibility API**: Detects when student switches tabs
- **Automatic Failure**: Timer fails immediately on tab switch
- **Penalty Logging**: Records cheating attempts in system

### 🌟 Bonus 2: Real-Time WebSockets
- **Socket.io Integration**: Bidirectional real-time communication
- **Instant Unlock**: App updates immediately when mentor assigns task
- **No Polling**: Efficient, sub-second latency
- **Auto-Reconnect**: Handles connection drops gracefully

## 📊 System Architecture

```
┌─────────────────┐
│   Student App   │ (React + Socket.io)
│   (Vercel)      │
└────────┬────────┘
         │
         │ REST API + WebSocket
         ▼
┌─────────────────┐
│  Backend Server │ (Node.js + Express)
│   (Render)      │
└────────┬────────┘
         │
         ├─── PostgreSQL (Supabase)
         │
         └─── n8n Webhook
                │
                ▼
         ┌─────────────┐
         │ n8n Workflow│
         │  (n8n.cloud)│
         └─────────────┘
                │
                └─── Email to Mentor
```

## 🛠️ Technology Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| **Frontend** | React 18 | Component-based, great for state management |
| **Backend** | Node.js + Express | Non-blocking I/O, perfect for WebSockets |
| **Database** | PostgreSQL | ACID compliance, relational data |
| **Automation** | n8n | Visual workflows, pause/resume capability |
| **Real-time** | Socket.io | Bidirectional WebSocket communication |
| **Deployment** | Vercel + Render + Supabase | Free tier, easy deployment |

## 📁 Project Structure

```
alcovia-intervention-engine/
├── server/                      # Backend (Node.js)
│   ├── server.js               # Main Express server
│   ├── db.js                   # Database connection
│   ├── database.sql            # Schema definition
│   ├── package.json
│   ├── .env                    # Environment variables
│   └── .env.example
│
├── client/                      # Frontend (React)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main component
│   │   ├── App.css             # Styling
│   │   ├── index.js            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── n8n_workflow.json           # Importable n8n workflow
│
├── README.md                   # Main documentation
├── QUICKSTART.md               # 5-minute setup guide
├── DEPLOYMENT.md               # Production deployment
├── TESTING.md                  # Test scenarios
├── ARCHITECTURE.md             # System design
├── TROUBLESHOOTING.md          # Common issues
├── SUBMISSION_CHECKLIST.md     # Pre-submission checklist
├── PROJECT_OVERVIEW.md         # This file
└── .gitignore
```

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Setup Database
- Create Supabase account
- Run `database.sql` in SQL Editor
- Copy connection string

### 3. Configure Environment
```bash
# server/.env
DATABASE_URL=your_supabase_url
N8N_WEBHOOK_URL=your_n8n_webhook

# client/.env
REACT_APP_API_URL=http://localhost:3001
```

### 4. Run Everything
```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm start
```

### 5. Test
- Open http://localhost:3000
- Submit check-in with score=4, minutes=30
- Watch app lock and email arrive!

## 🎥 Demo Flow

1. **Normal State**: Student sees timer and check-in form
2. **Submit Failure**: Enter score=4, minutes=30
3. **App Locks**: Shows "Waiting for Mentor..." with spinner
4. **n8n Triggers**: Workflow executes, email sent
5. **Mentor Acts**: Clicks "Assign Task" in email
6. **Real-time Unlock**: App unlocks instantly (WebSocket magic!)
7. **Remedial Task**: Student sees assigned task
8. **Complete**: Click "Mark Complete", return to normal

## 📈 What Makes This Special

### 1. Production-Ready Architecture
- Proper separation of concerns
- Error handling and logging
- Environment-based configuration
- Scalable design patterns

### 2. Real-World Problem Solving
- Addresses actual educational challenges
- Balances automation with human judgment
- Considers edge cases (mentor timeout)
- Implements fail-safe mechanisms

### 3. Modern Tech Stack
- Real-time communication (WebSockets)
- Visual workflow automation (n8n)
- Cloud-native deployment
- Mobile-responsive design

### 4. Attention to Detail
- Cheater detection
- Loading states
- Error messages
- Smooth animations
- Comprehensive documentation

## 🎓 Learning Outcomes

This project demonstrates:
- **Full-stack development**: Frontend, backend, database
- **System design**: State machines, event-driven architecture
- **Real-time systems**: WebSocket implementation
- **Workflow automation**: n8n integration
- **DevOps**: Deployment, environment management
- **Problem solving**: Fail-safe mechanisms, edge cases
- **Documentation**: Clear, comprehensive guides

## 📊 Metrics & Analytics

The system tracks:
- Daily check-ins per student
- Intervention trigger rate
- Mentor response time
- Task completion rate
- Tab switching incidents
- System uptime and performance

## 🔒 Security Features

- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Restricted origins
- **Environment Variables**: No hardcoded secrets
- **HTTPS**: Enforced in production
- **Input Validation**: Server-side checks

## 🌐 Deployment Strategy

### Development
- Local PostgreSQL or Supabase
- Local Node.js server
- Local React dev server
- n8n cloud for workflows

### Production
- **Frontend**: Vercel (CDN, auto-deploy)
- **Backend**: Render (auto-scaling, logs)
- **Database**: Supabase (managed PostgreSQL)
- **Automation**: n8n cloud (5000 executions/month)

**Total Cost**: $0/month (free tiers)

## 🔮 Future Enhancements

### Phase 2: Analytics Dashboard
- Mentor performance metrics
- Student progress tracking
- Intervention effectiveness analysis
- Predictive analytics

### Phase 3: Mobile Apps
- React Native iOS/Android
- Push notifications
- Offline support with sync
- Biometric authentication

### Phase 4: AI Integration
- Predict at-risk students
- Personalized task recommendations
- Auto-generated mentor notes
- Natural language processing for feedback

### Phase 5: Multi-Tenant
- Support multiple schools
- Role-based access control
- Custom workflows per organization
- White-label branding

## 📝 Documentation Guide

| Document | Purpose | Audience |
|----------|---------|----------|
| **README.md** | Overview, setup, features | Everyone |
| **QUICKSTART.md** | 5-minute local setup | Developers |
| **DEPLOYMENT.md** | Production deployment | DevOps |
| **TESTING.md** | Test scenarios | QA, Developers |
| **ARCHITECTURE.md** | System design | Technical reviewers |
| **TROUBLESHOOTING.md** | Common issues | Support, Developers |
| **SUBMISSION_CHECKLIST.md** | Pre-submission tasks | Submitters |
| **PROJECT_OVERVIEW.md** | High-level summary | Stakeholders |

## 🎯 Success Criteria

This project successfully demonstrates:

✅ **Technical Competence**
- Clean, maintainable code
- Proper architecture patterns
- Modern tech stack usage

✅ **Problem Solving**
- Addresses all 3 problem statements
- Implements bonus features
- Considers edge cases

✅ **System Design**
- Scalable architecture
- Fail-safe mechanisms
- Real-time capabilities

✅ **Product Thinking**
- User experience focus
- Clear state transitions
- Helpful error messages

✅ **Documentation**
- Comprehensive guides
- Clear instructions
- Troubleshooting help

## 🏁 Submission Deliverables

1. ✅ **Live App Link**: Deployed React app (Vercel)
2. ✅ **GitHub Repository**: Public, well-organized
3. ✅ **Loom Video**: 5-minute demo of full flow
4. ✅ **n8n Workflow**: Exported JSON file
5. ✅ **Documentation**: README with fail-safe explanation

## 💡 Key Insights

### What Worked Well
- WebSocket for real-time updates (much better than polling)
- n8n for visual workflow (easy to understand and modify)
- PostgreSQL for state management (ACID compliance crucial)
- Modular architecture (easy to test and debug)

### Challenges Overcome
- WebSocket connection management across deployments
- n8n webhook integration and testing
- State synchronization between frontend and backend
- Tab visibility detection for cheater prevention

### Design Decisions
- **Why PostgreSQL over MongoDB**: Need for transactions and relationships
- **Why n8n over custom code**: Visual workflows easier to modify
- **Why WebSocket over polling**: Better UX and lower server load
- **Why React over Vue**: Larger ecosystem and better documentation

## 🎉 Conclusion

The Alcovia Intervention Engine is a **production-ready, full-stack application** that demonstrates:
- Modern web development practices
- Real-time system architecture
- Human-in-the-loop automation
- Thoughtful system design
- Comprehensive documentation

It's not just a technical demo—it's a **complete solution** to a real educational problem, built with scalability, reliability, and user experience in mind.

---

**Built for**: Alcovia Full Stack Engineering Intern Assignment  
**Deadline**: 9pm, 24th November 2025  
**Submission**: https://forms.gle/1Qq9bcR7KPE6ZAgUA

**Ready to deploy and impress! 🚀**
