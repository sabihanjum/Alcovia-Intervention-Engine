# Submission Checklist - Alcovia Intervention Engine

## Pre-Submission Checklist

Use this checklist to ensure everything is ready before submitting.

---

## 1. Code & Repository

### GitHub Repository
- [ ] Repository is **public**
- [ ] All code is committed and pushed
- [ ] `.gitignore` excludes sensitive files
- [ ] No `.env` files committed
- [ ] Clear folder structure (server/, client/, n8n_workflow.json)

### Documentation
- [ ] README.md is comprehensive
- [ ] DEPLOYMENT.md has step-by-step instructions
- [ ] QUICKSTART.md for local setup
- [ ] TESTING.md with test scenarios
- [ ] ARCHITECTURE.md explains system design
- [ ] All markdown files are well-formatted

### Code Quality
- [ ] No console.log statements (or minimal)
- [ ] No commented-out code
- [ ] Consistent code formatting
- [ ] Meaningful variable names
- [ ] Comments where necessary

---

## 2. Backend Deployment

### Render/Railway Setup
- [ ] Backend is deployed and running
- [ ] Health endpoint responds: `/health`
- [ ] All environment variables configured:
  - [ ] DATABASE_URL
  - [ ] PORT
  - [ ] N8N_WEBHOOK_URL
  - [ ] FRONTEND_URL
  - [ ] NODE_ENV=production
- [ ] CORS configured for frontend URL
- [ ] Logs show no errors

### Test Backend
```bash
# Health check
curl https://your-backend.onrender.com/health

# Get student
curl https://your-backend.onrender.com/api/student/123

# Should return student data
```

- [ ] Health check returns 200 OK
- [ ] Student endpoint returns data
- [ ] No 500 errors in logs

---

## 3. Database Setup

### Supabase Configuration
- [ ] Database is created
- [ ] Schema is applied (database.sql)
- [ ] Sample student exists (ID: 123)
- [ ] Connection string is correct
- [ ] Backend can connect to database

### Verify Database
```sql
-- Run in Supabase SQL Editor
SELECT * FROM students;
SELECT * FROM daily_logs;
SELECT * FROM interventions;
```

- [ ] All tables exist
- [ ] Sample student is present
- [ ] No SQL errors

---

## 4. Frontend Deployment

### Vercel/Netlify Setup
- [ ] Frontend is deployed
- [ ] App loads without errors
- [ ] Environment variable set: REACT_APP_API_URL
- [ ] Build completed successfully
- [ ] No console errors in browser

### Test Frontend
- [ ] Open deployed URL
- [ ] App loads and shows student info
- [ ] Status shows "On Track"
- [ ] Timer is visible
- [ ] Check-in form is visible
- [ ] No JavaScript errors in console

---

## 5. n8n Workflow

### n8n Cloud Setup
- [ ] Workflow imported successfully
- [ ] All nodes are configured:
  - [ ] Webhook trigger
  - [ ] Email node (credentials added)
  - [ ] Wait node
  - [ ] HTTP request node
  - [ ] Response node
- [ ] Environment variables set:
  - [ ] BACKEND_URL
  - [ ] APPROVAL_URL
- [ ] Workflow is **activated** (toggle on)
- [ ] Webhook URL copied to backend .env

### Test n8n
```bash
# Test webhook
curl -X POST https://your-n8n.app.n8n.cloud/webhook/student-intervention \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","quiz_score":4,"focus_minutes":30,"student_name":"John Doe","student_email":"test@example.com"}'
```

- [ ] Webhook triggers execution
- [ ] Execution appears in n8n dashboard
- [ ] Email is sent
- [ ] Workflow pauses at Wait node

---

## 6. End-to-End Testing

### Test Complete Flow

#### Step 1: Failed Check-in
- [ ] Open deployed app
- [ ] Submit check-in: score=4, minutes=30
- [ ] App locks immediately
- [ ] Shows "Waiting for Mentor..." message
- [ ] Spinner is visible

#### Step 2: n8n Execution
- [ ] Check n8n dashboard
- [ ] New execution is running
- [ ] Workflow paused at Wait node
- [ ] Check email inbox
- [ ] Email received with student details

#### Step 3: Mentor Approval
- [ ] Click "Assign Task" in email
- [ ] n8n workflow resumes
- [ ] Backend receives intervention assignment
- [ ] Check n8n execution - should complete

#### Step 4: Real-time Unlock
- [ ] Return to app (don't refresh)
- [ ] App unlocks within 1-2 seconds
- [ ] Remedial task is displayed
- [ ] Task description is visible
- [ ] "Mark Complete" button is enabled

#### Step 5: Task Completion
- [ ] Click "Mark Complete"
- [ ] Success message appears
- [ ] Status returns to "On Track"
- [ ] Normal interface restored

### Bonus Features
- [ ] Tab switching detection works
- [ ] Timer fails when switching tabs
- [ ] WebSocket connection established
- [ ] Real-time updates work without refresh

---

## 7. Demo Video

### Recording Setup
- [ ] Loom account created (or OBS installed)
- [ ] Screen recording quality: 1080p
- [ ] Microphone enabled and tested
- [ ] Browser tabs organized
- [ ] Test run completed

### Video Content (Max 5 minutes)
- [ ] **Intro (30s)**: Explain the system
- [ ] **Normal State (30s)**: Show timer and form
- [ ] **Failure (1m)**: Submit bad score, show lockout
- [ ] **n8n (1m)**: Show execution and email
- [ ] **Approval (1m)**: Click link, show workflow
- [ ] **Unlock (1m)**: Show real-time unlock
- [ ] **Complete (30s)**: Finish task

### Video Quality
- [ ] Audio is clear
- [ ] Screen is visible
- [ ] No sensitive information shown
- [ ] Under 5 minutes
- [ ] Uploaded and link copied

---

## 8. Documentation Review

### README.md
- [ ] System overview is clear
- [ ] Architecture diagram included
- [ ] Setup instructions are complete
- [ ] API endpoints documented
- [ ] Fail-safe mechanism explained
- [ ] Bonus features highlighted

### Fail-Safe Mechanism
- [ ] Problem clearly stated
- [ ] Solution explained (multi-tier escalation)
- [ ] Implementation approach described
- [ ] Includes: 6h auto-assign, 12h escalate, 24h unlock

---

## 9. Submission Form

### Required Information
- [ ] Live App URL (Vercel/Netlify)
- [ ] GitHub Repository URL (public)
- [ ] Loom Video URL
- [ ] Your name and email
- [ ] Any additional notes

### URLs to Submit
```
Live App: https://your-app.vercel.app
GitHub: https://github.com/yourusername/alcovia-intervention-engine
Video: https://www.loom.com/share/your-video-id
Backend: https://your-backend.onrender.com (optional)
```

---

## 10. Final Checks

### Functionality
- [ ] All 3 problem statements solved:
  1. [ ] Backend with Logic Gate
  2. [ ] n8n Human-in-the-Loop workflow
  3. [ ] Frontend with state-based UI
- [ ] Closed-loop system works end-to-end
- [ ] Real-time updates via WebSocket
- [ ] Tab switching detection (bonus)

### Deployment
- [ ] All services are live and accessible
- [ ] No 404 or 500 errors
- [ ] Environment variables configured
- [ ] HTTPS enabled (automatic)

### Code Quality
- [ ] Clean, readable code
- [ ] Proper error handling
- [ ] No hardcoded secrets
- [ ] Comments where needed

### Documentation
- [ ] README is comprehensive
- [ ] Setup instructions are clear
- [ ] Architecture is explained
- [ ] Fail-safe mechanism documented

### Video
- [ ] Demonstrates full flow
- [ ] Under 5 minutes
- [ ] Good quality
- [ ] Link works

---

## Ready to Submit?

If all boxes are checked, you're ready to submit!

### Submission Form
https://forms.gle/1Qq9bcR7KPE6ZAgUA

### Deadline
**9pm, 24th November 2025**

---

## Quick Reference

### Your URLs
```
Frontend: ___________________________________
Backend:  ___________________________________
GitHub:   ___________________________________
Video:    ___________________________________
n8n:      ___________________________________
```

### Test Credentials
```
Student ID: 123
Test Email: ___________________________________
```

---

## What Reviewers Will Check

1. **Can they access the live app?**
   - URL works
   - App loads
   - No errors

2. **Does the intervention flow work?**
   - Submit bad score
   - App locks
   - Email received
   - Approve task
   - App unlocks
   - Complete task

3. **Is the code clean?**
   - Well-organized
   - Readable
   - Documented

4. **Is the system design sound?**
   - Fail-safe mechanism
   - Architecture explanation
   - Scalability considerations

5. **Bonus features?**
   - WebSocket real-time updates
   - Tab switching detection

---

## Pro Tips

1. **Test from incognito**: Ensure app works without cache
2. **Test on mobile**: Check responsive design
3. **Share with friend**: Get them to test the flow
4. **Record backup video**: In case first one has issues
5. **Submit early**: Don't wait until last minute

---

## Common Issues

### App doesn't load
- Check Vercel deployment logs
- Verify build completed
- Check environment variables

### Backend errors
- Check Render logs
- Verify database connection
- Test endpoints with curl

### n8n not triggering
- Verify webhook URL in backend
- Check workflow is activated
- Test webhook directly with curl

### Email not received
- Check spam folder
- Verify email credentials in n8n
- Test email node separately

### WebSocket not working
- Check browser console
- Verify backend supports WebSocket
- Check CORS configuration

---

## You've Got This!

This is a comprehensive system that demonstrates:
- Full-stack development skills
- System design thinking
- Real-time architecture
- Human-in-the-loop workflows
- Production deployment

Take your time, test thoroughly, and submit with confidence!

---

**Good luck! 🚀**
