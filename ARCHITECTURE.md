# System Architecture - Alcovia Intervention Engine

## Overview

The Alcovia Intervention Engine is a closed-loop system implementing a **Human-in-the-Loop** architecture for real-time student intervention management.

## Core Principles

1. **State-Driven**: Student status drives UI and workflow behavior
2. **Event-Driven**: Actions trigger cascading events across system
3. **Real-Time**: WebSocket communication for instant updates
4. **Fail-Safe**: Multiple fallback mechanisms for reliability

## System Components

### 1. Frontend (React SPA)

**Technology**: React 18, Socket.io-client, Axios

**Responsibilities**:
- Render state-specific UI (Normal, Locked, Remedial)
- Track focus time with timer
- Detect tab switching (cheater detection)
- Maintain WebSocket connection
- Submit check-ins to backend

**State Machine**:
```
┌─────────────┐
│  On Track   │ ◄─────────────────────┐
└──────┬──────┘                       │
       │                              │
       │ Failed Check-in              │ Task Complete
       ▼                              │
┌─────────────────────┐               │
│ Needs Intervention  │               │
└──────┬──────────────┘               │
       │                              │
       │ Mentor Assigns Task          │
       ▼                              │
┌─────────────────┐                   │
│  Remedial Task  │ ──────────────────┘
└─────────────────┘
```

**Key Features**:
- **Tab Visibility API**: Detects when user switches tabs
- **WebSocket Reconnection**: Auto-reconnects on disconnect
- **Optimistic Updates**: Shows loading states during API calls

---

### 2. Backend (Node.js + Express)

**Technology**: Express, PostgreSQL (pg), Socket.io, Axios

**Responsibilities**:
- Manage student state transitions
- Enforce business logic (The Logic Gate)
- Trigger n8n webhooks
- Emit WebSocket events
- Serve REST API

**API Endpoints**:

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /health | Health check | None |
| GET | /api/student/:id | Get student data | None |
| POST | /api/daily-checkin | Submit check-in | None |
| POST | /api/assign-intervention | Assign task (n8n) | None |
| POST | /api/complete-intervention | Complete task | None |
| GET | /api/logs/:id | Get student logs | None |

**The Logic Gate**:
```javascript
function evaluateCheckin(quiz_score, focus_minutes) {
  if (quiz_score > 7 && focus_minutes > 60) {
    return { status: 'On Track', trigger_intervention: false };
  } else {
    return { status: 'Needs Intervention', trigger_intervention: true };
  }
}
```

**WebSocket Events**:
- `register`: Client registers for updates
- `intervention_assigned`: Notify client of new task
- `disconnect`: Clean up client connection

---

### 3. Database (PostgreSQL)

**Technology**: PostgreSQL 14+

**Schema Design**:

```sql
students
├── id (PK)
├── student_id (UNIQUE)
├── name
├── email
├── status (ENUM-like)
└── timestamps

daily_logs
├── id (PK)
├── student_id (FK)
├── quiz_score
├── focus_minutes
├── status
└── logged_at

interventions
├── id (PK)
├── student_id (FK)
├── task_description
├── mentor_notes
├── status
├── assigned_at
└── completed_at
```

**Indexes** (for performance):
```sql
CREATE INDEX idx_student_id ON daily_logs(student_id);
CREATE INDEX idx_intervention_status ON interventions(student_id, status);
CREATE INDEX idx_student_status ON students(status);
```

**Constraints**:
- Foreign keys ensure referential integrity
- Status values validated at application layer
- Timestamps auto-managed with triggers

---

### 4. Automation Layer (n8n)

**Technology**: n8n workflow automation

**Workflow Steps**:

1. **Webhook Trigger**: Receives student failure data
2. **Email Notification**: Sends alert to mentor
3. **Wait Node**: Pauses execution for mentor action
4. **HTTP Request**: Calls backend to assign intervention
5. **Response**: Confirms completion

**Workflow JSON Structure**:
```json
{
  "nodes": [
    "Webhook Trigger",
    "Send Email",
    "Wait for Approval",
    "Assign Intervention",
    "Respond to Webhook"
  ],
  "connections": { /* Sequential flow */ }
}
```

**Key Features**:
- **Pause/Resume**: Workflow waits indefinitely for mentor
- **Error Handling**: Retries on backend failures
- **Logging**: All executions tracked in n8n dashboard

---

## Data Flow Diagrams

### Flow 1: Successful Check-in

```
Student App
    │
    │ POST /daily-checkin
    │ { quiz_score: 8, focus_minutes: 65 }
    ▼
Backend
    │
    │ Evaluate: PASS
    │ Update DB: status = 'On Track'
    ▼
Database
    │
    ◄─── Response: { status: 'On Track' }
    │
Student App
    │
    └─── Display success message
```

### Flow 2: Failed Check-in (Full Intervention Loop)

```
Student App
    │
    │ POST /daily-checkin
    │ { quiz_score: 4, focus_minutes: 30 }
    ▼
Backend
    │
    ├─── Update DB: status = 'Needs Intervention'
    │
    ├─── POST to n8n webhook
    │
    └─── Response: { status: 'Pending Mentor Review' }
    │
    ▼
Student App (LOCKED)
    │
    └─── Display "Waiting for Mentor..."

n8n Workflow
    │
    ├─── Send email to mentor
    │
    └─── WAIT (paused execution)

Mentor Email
    │
    │ Click "Assign Task"
    ▼
n8n Workflow (RESUMED)
    │
    │ POST /assign-intervention
    ▼
Backend
    │
    ├─── Update DB: status = 'Remedial Task'
    │
    ├─── Create intervention record
    │
    └─── Emit WebSocket: 'intervention_assigned'
    │
    ▼
Student App (UNLOCKED)
    │
    └─── Display remedial task

Student
    │
    │ Click "Mark Complete"
    │
    │ POST /complete-intervention
    ▼
Backend
    │
    ├─── Update DB: status = 'On Track'
    │
    └─── Update intervention: status = 'Completed'
    │
    ▼
Student App
    │
    └─── Return to normal state
```

---

## Real-Time Communication

### WebSocket Architecture

```
Client                          Server
  │                               │
  │ ─── Connect ─────────────────>│
  │                               │
  │ <── Connection ACK ───────────│
  │                               │
  │ ─── emit('register', '123') ─>│
  │                               │ socket.join('student_123')
  │                               │
  │                               │ [Intervention assigned]
  │                               │
  │ <── emit('intervention_assigned') ──│
  │                               │
  │ Update UI instantly           │
```

**Benefits**:
- No polling required
- Sub-second latency
- Reduced server load
- Better user experience

**Fallback**: If WebSocket fails, app can still poll `/api/student/:id`

---

## Security Considerations

### Current Implementation

1. **SQL Injection Prevention**: Parameterized queries
2. **CORS**: Configured for specific origins
3. **Environment Variables**: Secrets not in code
4. **HTTPS**: Required in production

### Future Enhancements

1. **Authentication**: JWT tokens for API access
2. **Rate Limiting**: Prevent abuse of endpoints
3. **Input Validation**: Joi/Zod schemas
4. **Encryption**: Sensitive data at rest
5. **Audit Logs**: Track all state changes

---

## Scalability Considerations

### Current Capacity

- **Students**: 1,000+ concurrent users
- **Database**: 500MB free tier (Supabase)
- **Backend**: 750 hours/month (Render free tier)
- **n8n**: 5,000 executions/month

### Scaling Strategy

#### Horizontal Scaling
```
Load Balancer
    │
    ├─── Backend Instance 1
    ├─── Backend Instance 2
    └─── Backend Instance 3
         │
         └─── Shared PostgreSQL
```

#### Database Scaling
- Read replicas for queries
- Connection pooling (already implemented)
- Caching layer (Redis) for student status

#### WebSocket Scaling
- Redis adapter for Socket.io
- Sticky sessions on load balancer
- Separate WebSocket server cluster

---

## Fail-Safe Mechanisms

### 1. Mentor Timeout Handling

**Problem**: Mentor doesn't respond, student locked indefinitely

**Solution**: Multi-tier escalation

```
0 hours: Student locked, mentor notified
6 hours: Auto-assign default task
12 hours: Escalate to Head Mentor
24 hours: Emergency unlock
```

**Implementation**:
```javascript
// In n8n, add parallel branches
Wait(6h) → Auto-assign default task
Wait(12h) → Escalate notification
Wait(24h) → Emergency unlock API call
```

### 2. Database Connection Loss

**Current**: Connection pool with retry logic

**Enhancement**:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Retry logic
  retry: {
    max: 3,
    backoff: 'exponential'
  }
});
```

### 3. n8n Webhook Failure

**Current**: Try-catch with logging

**Enhancement**:
```javascript
try {
  await axios.post(webhookUrl, data, { timeout: 5000 });
} catch (error) {
  // Log to monitoring service
  logger.error('n8n webhook failed', error);
  
  // Queue for retry
  await retryQueue.add({ webhookUrl, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}
```

### 4. WebSocket Disconnection

**Current**: Auto-reconnect in Socket.io client

**Enhancement**:
```javascript
socket.on('disconnect', () => {
  // Exponential backoff reconnection
  setTimeout(() => socket.connect(), retryDelay);
  retryDelay *= 2;
});

// Fallback to polling
if (!socket.connected) {
  setInterval(() => fetchStudentData(), 5000);
}
```

---

## Monitoring & Observability

### Metrics to Track

1. **Performance**:
   - API response times
   - Database query times
   - WebSocket connection count

2. **Business**:
   - Check-ins per day
   - Intervention rate
   - Average mentor response time
   - Task completion rate

3. **Errors**:
   - Failed check-ins
   - n8n webhook failures
   - Database connection errors

### Logging Strategy

```javascript
// Structured logging
logger.info('Check-in submitted', {
  student_id: '123',
  quiz_score: 4,
  focus_minutes: 30,
  result: 'intervention_triggered',
  timestamp: new Date().toISOString()
});
```

### Alerting

- Email alert if intervention rate > 50%
- Slack notification on system errors
- Dashboard for real-time metrics

---

## Technology Choices Rationale

### Why PostgreSQL?
- **ACID compliance**: Critical for state transitions
- **Relational data**: Students, logs, interventions are related
- **Complex queries**: Analytics on intervention patterns
- **Mature ecosystem**: Well-supported, reliable

### Why Node.js?
- **Non-blocking I/O**: Handles concurrent WebSocket connections
- **JavaScript everywhere**: Same language as frontend
- **Rich ecosystem**: Express, Socket.io, pg libraries
- **Fast development**: Quick to prototype and iterate

### Why React?
- **Component-based**: Reusable UI components
- **State management**: Built-in hooks for complex state
- **Large community**: Easy to find solutions
- **Performance**: Virtual DOM for efficient updates

### Why n8n?
- **Visual workflows**: Non-technical mentors can understand
- **No-code changes**: Modify intervention logic without deployment
- **Built-in integrations**: Email, webhooks, HTTP requests
- **Pause/resume**: Perfect for human-in-the-loop workflows

### Why WebSockets?
- **Real-time**: Instant updates without polling
- **Efficient**: Single persistent connection
- **Bidirectional**: Server can push to client
- **Better UX**: Feels more responsive

---

## Future Enhancements

### Phase 2: Analytics Dashboard
- Mentor performance metrics
- Student progress tracking
- Intervention effectiveness analysis

### Phase 3: Mobile Apps
- React Native iOS/Android apps
- Push notifications for interventions
- Offline support with sync

### Phase 4: AI Integration
- Predict students at risk before failure
- Suggest personalized remedial tasks
- Auto-generate mentor notes

### Phase 5: Multi-Tenant
- Support multiple schools/organizations
- Role-based access control
- Custom intervention workflows per tenant

---

## Deployment Architecture

### Development
```
localhost:3000 (React)
localhost:3001 (Node.js)
localhost:5432 (PostgreSQL)
n8n.cloud (n8n)
```

### Production
```
Vercel (React SPA)
    │
    └─── HTTPS ───> Render (Node.js)
                        │
                        └─── Supabase (PostgreSQL)
                        
n8n.cloud (Automation)
```

### CI/CD Pipeline
```
GitHub Push
    │
    ├─── Vercel Auto-Deploy (Frontend)
    │
    └─── Render Auto-Deploy (Backend)
```

---

## Conclusion

The Alcovia Intervention Engine demonstrates a production-ready architecture that balances:
- **Simplicity**: Easy to understand and maintain
- **Reliability**: Fail-safe mechanisms and error handling
- **Performance**: Real-time updates and efficient queries
- **Scalability**: Can grow with user base
- **Maintainability**: Clear separation of concerns

This architecture can serve as a foundation for a full-scale student management platform.
