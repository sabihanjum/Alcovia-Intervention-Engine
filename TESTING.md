# Testing Guide - Alcovia Intervention Engine

## Manual Testing Scenarios

### Scenario 1: Successful Check-in (Happy Path)

**Objective**: Verify student stays "On Track" with good performance

**Steps**:
1. Open app at http://localhost:3000
2. Start Focus Timer
3. Wait 1 minute (or manually enter 65 minutes)
4. Stop timer
5. Enter Quiz Score: 8
6. Click "Submit Check-in"

**Expected Results**:
- ✅ Status remains "On Track"
- ✅ Success message displayed
- ✅ No email sent
- ✅ No n8n workflow triggered
- ✅ App remains unlocked

**Database Verification**:
```sql
SELECT * FROM daily_logs ORDER BY logged_at DESC LIMIT 1;
-- Should show status = 'On Track'

SELECT status FROM students WHERE student_id = '123';
-- Should show 'On Track'
```

---

### Scenario 2: Failed Check-in (Intervention Trigger)

**Objective**: Verify intervention system activates on poor performance

**Steps**:
1. Open app
2. Enter Quiz Score: 4
3. Enter Focus Minutes: 30
4. Click "Submit Check-in"

**Expected Results**:
- ✅ App immediately locks
- ✅ Shows "Analysis in Progress" screen
- ✅ Displays "Waiting for Mentor..." message
- ✅ Spinner animation visible
- ✅ All input fields disabled
- ✅ n8n webhook triggered
- ✅ Email sent to mentor

**Database Verification**:
```sql
SELECT status FROM students WHERE student_id = '123';
-- Should show 'Needs Intervention'

SELECT * FROM daily_logs ORDER BY logged_at DESC LIMIT 1;
-- Should show status = 'Needs Intervention'
```

**n8n Verification**:
- Check n8n dashboard → Executions
- Should see new execution in "Running" state
- Workflow paused at "Wait for Mentor Approval" node

---

### Scenario 3: Mentor Intervention Assignment

**Objective**: Verify mentor can assign remedial tasks

**Prerequisites**: Complete Scenario 2 first

**Steps**:
1. Check email inbox
2. Open "Student Intervention Required" email
3. Verify email contains:
   - Student name and ID
   - Quiz score and focus time
   - "Assign Task" button
4. Click "Assign Task: Read Chapter 4" button

**Expected Results**:
- ✅ n8n workflow resumes
- ✅ Backend receives POST to /assign-intervention
- ✅ Database updated with intervention record
- ✅ Student status changes to "Remedial Task"
- ✅ WebSocket emits update to client

**Database Verification**:
```sql
SELECT * FROM interventions WHERE student_id = '123' ORDER BY assigned_at DESC LIMIT 1;
-- Should show new intervention with status = 'Pending'

SELECT status FROM students WHERE student_id = '123';
-- Should show 'Remedial Task'
```

---

### Scenario 4: Real-time App Unlock (WebSocket)

**Objective**: Verify instant unlock without page refresh

**Prerequisites**: Complete Scenario 3

**Steps**:
1. Keep app open in browser (from Scenario 2)
2. Complete Scenario 3 (mentor assigns task)
3. Watch the app WITHOUT refreshing

**Expected Results**:
- ✅ App unlocks instantly (within 1 second)
- ✅ Lock screen disappears
- ✅ Remedial task screen appears
- ✅ Task description visible
- ✅ "Mark Complete" button enabled
- ✅ No page refresh required

**Browser Console Verification**:
```
Connected to WebSocket
Intervention assigned: {intervention: {...}}
```

---

### Scenario 5: Task Completion

**Objective**: Verify student can complete remedial task

**Prerequisites**: Complete Scenario 4

**Steps**:
1. Read the task description
2. Click "Mark Complete" button

**Expected Results**:
- ✅ Success message displayed
- ✅ Status returns to "On Track"
- ✅ Normal interface restored
- ✅ Focus timer available again
- ✅ Check-in form available

**Database Verification**:
```sql
SELECT * FROM interventions WHERE student_id = '123' ORDER BY assigned_at DESC LIMIT 1;
-- Should show status = 'Completed' and completed_at timestamp

SELECT status FROM students WHERE student_id = '123';
-- Should show 'On Track'
```

---

### Scenario 6: Cheater Detection (Bonus Feature)

**Objective**: Verify tab switching detection

**Steps**:
1. Open app
2. Click "Start Focus Timer"
3. Wait 10 seconds
4. Switch to another browser tab or minimize window
5. Return to app tab

**Expected Results**:
- ✅ Timer stops immediately
- ✅ Warning message: "Timer failed! Tab switching detected"
- ✅ Session marked as failed
- ✅ Focus minutes not recorded
- ✅ Penalty logged

**Browser Console Verification**:
```
Tab switch detected during focus session
```

---

## API Testing with curl

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok","message":"Alcovia Intervention Engine is running"}
```

### Test Get Student
```bash
curl http://localhost:3001/api/student/123
```

Expected:
```json
{
  "student": {
    "id": 1,
    "student_id": "123",
    "name": "John Doe",
    "status": "On Track"
  },
  "pendingIntervention": null
}
```

### Test Daily Check-in (Success)
```bash
curl -X POST http://localhost:3001/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","quiz_score":8,"focus_minutes":65}'
```

Expected:
```json
{"status":"On Track","message":"Great job! Keep it up!"}
```

### Test Daily Check-in (Failure)
```bash
curl -X POST http://localhost:3001/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","quiz_score":4,"focus_minutes":30}'
```

Expected:
```json
{"status":"Pending Mentor Review","message":"Your performance needs attention. A mentor will review shortly."}
```

### Test Assign Intervention
```bash
curl -X POST http://localhost:3001/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","task_description":"Read Chapter 4","mentor_notes":"Focus on examples"}'
```

Expected:
```json
{
  "success": true,
  "message": "Intervention assigned successfully",
  "intervention": {...}
}
```

### Test Complete Intervention
```bash
curl -X POST http://localhost:3001/api/complete-intervention \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","intervention_id":1}'
```

Expected:
```json
{
  "success": true,
  "message": "Task completed! You are back on track.",
  "status": "On Track"
}
```

---

## Database Testing

### Check Student Status
```sql
SELECT student_id, name, status, updated_at 
FROM students 
WHERE student_id = '123';
```

### View Recent Logs
```sql
SELECT student_id, quiz_score, focus_minutes, status, logged_at 
FROM daily_logs 
ORDER BY logged_at DESC 
LIMIT 5;
```

### View Interventions
```sql
SELECT student_id, task_description, status, assigned_at, completed_at 
FROM interventions 
ORDER BY assigned_at DESC;
```

### Reset Student for Testing
```sql
-- Reset student status
UPDATE students SET status = 'On Track' WHERE student_id = '123';

-- Clear interventions
DELETE FROM interventions WHERE student_id = '123';

-- Clear logs (optional)
DELETE FROM daily_logs WHERE student_id = '123';
```

---

## n8n Testing

### Test Webhook Directly
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/student-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123",
    "quiz_score": 4,
    "focus_minutes": 30,
    "student_name": "John Doe",
    "student_email": "student@example.com",
    "timestamp": "2025-11-23T12:00:00Z"
  }'
```

### Test Approval Webhook
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/mentor-approval \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123",
    "task": "Read Chapter 4 and complete exercises",
    "notes": "Focus on understanding core concepts"
  }'
```

---

## WebSocket Testing

### Browser Console Test
```javascript
// Open browser console on app page
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('register', '123');
});

socket.on('intervention_assigned', (data) => {
  console.log('Intervention received:', data);
});
```

---

## Performance Testing

### Load Test with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test check-in endpoint
ab -n 100 -c 5 -p checkin.json -T application/json \
  http://localhost:3001/api/daily-checkin
```

Create `checkin.json`:
```json
{"student_id":"123","quiz_score":8,"focus_minutes":65}
```

---

## Edge Cases to Test

### 1. Invalid Input
- Quiz score > 10
- Negative focus minutes
- Missing student_id
- Non-existent student

### 2. Concurrent Requests
- Multiple check-ins at same time
- Completing intervention while locked
- Starting timer while in remedial state

### 3. Network Issues
- Backend offline
- n8n webhook timeout
- WebSocket disconnection

### 4. State Transitions
- On Track → Needs Intervention → Remedial Task → On Track
- Multiple interventions in sequence
- Completing old intervention after new one assigned

---

## Automated Testing (Optional)

### Jest Test Example
```javascript
// server/tests/checkin.test.js
const request = require('supertest');
const app = require('../server');

describe('POST /api/daily-checkin', () => {
  test('Success case', async () => {
    const response = await request(app)
      .post('/api/daily-checkin')
      .send({
        student_id: '123',
        quiz_score: 8,
        focus_minutes: 65
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('On Track');
  });

  test('Failure case', async () => {
    const response = await request(app)
      .post('/api/daily-checkin')
      .send({
        student_id: '123',
        quiz_score: 4,
        focus_minutes: 30
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Pending Mentor Review');
  });
});
```

---

## Testing Checklist

Before submission, verify:

- [ ] All API endpoints respond correctly
- [ ] Database schema is correct
- [ ] Student can submit successful check-in
- [ ] Student can submit failed check-in
- [ ] App locks on failure
- [ ] n8n workflow triggers
- [ ] Email is sent
- [ ] Mentor can assign task
- [ ] WebSocket updates work
- [ ] App unlocks in real-time
- [ ] Student can complete task
- [ ] Status returns to On Track
- [ ] Tab switching detection works
- [ ] Timer tracks time accurately
- [ ] All state transitions work
- [ ] Error handling works
- [ ] CORS is configured
- [ ] Environment variables are set

---

## Troubleshooting

### App doesn't lock after failed check-in
- Check backend logs for errors
- Verify database connection
- Check student status in database

### Email not received
- Check n8n execution history
- Verify email credentials
- Check spam folder
- Test email node separately

### WebSocket not working
- Check browser console for errors
- Verify backend WebSocket server is running
- Check CORS configuration
- Test with socket.io client directly

### Database errors
- Check connection string
- Verify tables exist
- Check for SQL syntax errors
- Review database logs

---

**Testing Time**: ~30 minutes for full manual test
**Automated Tests**: Optional but recommended
