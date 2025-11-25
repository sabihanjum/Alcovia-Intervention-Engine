# Deployment Guide - Alcovia Intervention Engine

This guide will help you deploy the complete system to production.

## Step 1: Database Setup (Supabase)

### Create Database

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Wait for database to provision
4. Go to SQL Editor
5. Copy and paste contents of `server/database.sql`
6. Click "Run"

### Get Connection String

1. Go to Project Settings → Database
2. Copy the connection string (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password
4. Save this for backend deployment

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

## Step 2: Backend Deployment (Render)

### Deploy to Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: alcovia-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Environment Variables

Add these in Render dashboard:

```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
PORT=3001
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/student-intervention
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Deploy

1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. Copy your backend URL: `https://alcovia-backend.onrender.com`
4. Test health endpoint: `https://alcovia-backend.onrender.com/health`

## Step 3: Frontend Deployment (Vercel)

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Environment Variables

Add in Vercel dashboard:

```
REACT_APP_API_URL=https://alcovia-backend.onrender.com
```

### Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Copy your app URL: `https://alcovia-student-app.vercel.app`
4. Test the app in browser

### Update Backend CORS

Go back to Render and update `FRONTEND_URL` to your Vercel URL.

## Step 4: n8n Workflow Setup

### Option A: n8n Cloud (Recommended)

1. Go to [n8n.cloud](https://n8n.cloud) and create account
2. Create new workflow
3. Click "..." → "Import from File"
4. Upload `n8n_workflow.json`

### Configure Nodes

#### 1. Webhook Node
- Already configured
- Copy the webhook URL
- Format: `https://your-instance.app.n8n.cloud/webhook/student-intervention`

#### 2. Email Node
- Click on "Send Email to Mentor" node
- Add your email credentials:
  - **SMTP Host**: smtp.gmail.com (for Gmail)
  - **SMTP Port**: 587
  - **User**: your-email@gmail.com
  - **Password**: your-app-password
- Update `fromEmail` to your email
- Update `toEmail` to mentor email (or use `={{ $json.student_email }}`)

#### 3. Wait Node
- Already configured to wait for webhook
- Copy the resume webhook URL
- Format: `https://your-instance.app.n8n.cloud/webhook/mentor-approval`

#### 4. HTTP Request Node
- Update URL to your backend: `https://alcovia-backend.onrender.com/api/assign-intervention`

### Set Environment Variables

In n8n workflow settings:

```
BACKEND_URL=https://alcovia-backend.onrender.com
APPROVAL_URL=https://your-instance.app.n8n.cloud/webhook/mentor-approval
```

### Activate Workflow

1. Click "Active" toggle in top right
2. Workflow is now live

### Update Backend

Go to Render and update `N8N_WEBHOOK_URL` with your webhook URL.

## Step 5: Connect Everything

### Update All URLs

1. **Backend** → Update `FRONTEND_URL` and `N8N_WEBHOOK_URL`
2. **Frontend** → Update `REACT_APP_API_URL`
3. **n8n** → Update `BACKEND_URL` and `APPROVAL_URL`

### Test the Flow

1. Open your Vercel app
2. Submit a failed check-in (score < 7 or time < 60)
3. Check n8n executions
4. Check your email
5. Click approval link
6. Watch app unlock in real-time

## 📧 Step 6: Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account → Security
   - Click "App passwords"
   - Select "Mail" and "Other"
   - Copy the 16-character password
3. Use this in n8n email node

### Alternative: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Use SendGrid node in n8n instead of Email node

## Testing Production

### Test Checklist

- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] Can fetch student data
- [ ] Failed check-in triggers n8n
- [ ] Email is received
- [ ] Approval link works
- [ ] WebSocket connection established
- [ ] Real-time unlock works
- [ ] Task completion works

### Debug Common Issues

#### Backend not connecting to database
- Check DATABASE_URL format
- Ensure Supabase allows external connections
- Check Render logs

#### Frontend can't reach backend
- Check CORS settings
- Verify REACT_APP_API_URL is correct
- Check browser console for errors

#### n8n webhook not triggering
- Verify webhook URL in backend .env
- Check n8n execution history
- Test webhook with curl:
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/student-intervention \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","quiz_score":4,"focus_minutes":30}'
```

#### WebSocket not connecting
- Check if backend supports WebSocket (Render does)
- Verify FRONTEND_URL in backend
- Check browser console for WebSocket errors

## Performance Optimization

### Backend
- Enable connection pooling (already configured)
- Add Redis for session management (optional)
- Set up monitoring with Render metrics

### Frontend
- Build is already optimized by Create React App
- Vercel automatically serves from CDN
- Enable gzip compression (automatic on Vercel)

### Database
- Add indexes on frequently queried columns:
```sql
CREATE INDEX idx_student_id ON daily_logs(student_id);
CREATE INDEX idx_intervention_status ON interventions(student_id, status);
```

## Monitoring

### Backend Monitoring
- Render provides logs and metrics
- Set up alerts for errors
- Monitor response times

### Frontend Monitoring
- Vercel Analytics (free tier)
- Track page loads and errors

### n8n Monitoring
- Check execution history
- Set up error notifications
- Monitor webhook response times

## Security Checklist

- [ ] Database credentials in environment variables
- [ ] CORS configured correctly
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Rate limiting on API endpoints (add if needed)
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Environment variables not committed to Git

## Cost Estimate

- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Render**: Free tier (750 hours/month)
- **Vercel**: Free tier (100GB bandwidth)
- **n8n Cloud**: Free tier (5,000 executions/month)

**Total**: $0/month for this project scale

## Creating Demo Video

### Recording Setup

1. Use Loom (free) or OBS Studio
2. Record in 1080p
3. Enable microphone
4. Keep under 5 minutes

### Script

1. **Intro (30s)**: Show app, explain system
2. **Normal State (30s)**: Show timer and check-in form
3. **Failure (1m)**: Submit bad score, show lockout
4. **n8n (1m)**: Show execution, email received
5. **Approval (1m)**: Click link, show workflow
6. **Unlock (1m)**: Show real-time unlock
7. **Complete (30s)**: Finish task, back to normal

### Upload

1. Upload to Loom or YouTube (unlisted)
2. Copy shareable link
3. Add to submission form

## Submission Checklist

- [ ] Live app URL (Vercel)
- [ ] Backend URL (Render)
- [ ] GitHub repository (public)
- [ ] README with setup instructions
- [ ] n8n workflow JSON exported
- [ ] Demo video (Loom link)
- [ ] All features working
- [ ] Bonus features implemented

## Support

If you encounter issues:

1. Check Render logs for backend errors
2. Check Vercel logs for frontend errors
3. Check n8n execution history
4. Review browser console for client errors
5. Test each component independently

## You're Done!

Your Alcovia Intervention Engine is now live and ready for testing!

Submit your links via the Google Form: https://forms.gle/1Qq9bcR7KPE6ZAgUA
