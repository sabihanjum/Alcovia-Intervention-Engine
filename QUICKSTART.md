# Quick Start Guide - 5 Minutes to Running

## Prerequisites
- Node.js installed
- PostgreSQL running locally OR Supabase account
- n8n account (cloud.n8n.io)

## 1. Clone and Install (2 minutes)

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

## 2. Setup Database (1 minute)

### Option A: Local PostgreSQL
```bash
# Create database
createdb alcovia_db

# Run schema
psql alcovia_db < server/database.sql
```

### Option B: Supabase (Recommended)
1. Go to supabase.com → Create project
2. SQL Editor → Paste `server/database.sql` → Run
3. Copy connection string from Settings → Database

## 3. Configure Environment (1 minute)

### Backend (.env)
```bash
cd server
cp .env.example .env
# Edit .env with your values
```

Required:
```
DATABASE_URL=postgresql://...
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/student-intervention
```

### Frontend (.env)
```bash
cd client
cp .env.example .env
```

Required:
```
REACT_APP_API_URL=http://localhost:3001
```

## 4. Setup n8n (1 minute)

1. Go to n8n.cloud → Create account
2. Import `n8n_workflow.json`
3. Configure email node with your credentials
4. Activate workflow
5. Copy webhook URL → Update backend .env

## 5. Run Everything

### Terminal 1 - Backend
```bash
cd server
npm start
```

### Terminal 2 - Frontend
```bash
cd client
npm start
```

## 6. Test It!

1. Open http://localhost:3000
2. Submit check-in with:
   - Quiz Score: 4
   - Focus Minutes: 30
3. Watch app lock
4. Check your email
5. Click approval link
6. Watch app unlock instantly!

## Common Issues

### Database connection failed
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### n8n webhook not working
- Verify webhook URL is correct
- Check n8n workflow is active
- Test with curl:
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","quiz_score":4,"focus_minutes":30}'
```

### Frontend can't connect
- Ensure backend is running on port 3001
- Check REACT_APP_API_URL in .env
- Clear browser cache

## Next Steps

- Read DEPLOYMENT.md for production deployment
- Read README.md for full documentation
- Record demo video for submission

## Need Help?

Check the logs:
- Backend: Terminal 1 output
- Frontend: Browser console (F12)
- n8n: Executions tab in n8n dashboard

---

**Time to complete**: ~5 minutes
**Ready to deploy**: See DEPLOYMENT.md
