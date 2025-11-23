# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### npm install fails

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# On Windows
Run PowerShell as Administrator

# On Mac/Linux
sudo npm install -g npm
```

### PostgreSQL connection refused

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
# Windows
services.msc (look for PostgreSQL)

# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

---

## Backend Issues

### Port already in use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Database connection fails

**Error**: `password authentication failed`

**Solution**:
1. Check DATABASE_URL in `.env`
2. Verify PostgreSQL user exists
3. Reset password:
```bash
psql postgres
ALTER USER postgres PASSWORD 'newpassword';
```

### n8n webhook timeout

**Error**: `ETIMEDOUT` or `ECONNREFUSED`

**Solution**:
1. Check n8n workflow is activated
2. Verify webhook URL is correct
3. Test webhook directly:
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

---

## Frontend Issues

### App shows blank screen

**Error**: White screen, no errors

**Solution**:
1. Check browser console (F12)
2. Verify REACT_APP_API_URL in `.env`
3. Clear browser cache
4. Rebuild:
```bash
rm -rf node_modules build
npm install
npm start
```

### CORS error

**Error**: `Access-Control-Allow-Origin`

**Solution**:
1. Check backend CORS configuration
2. Verify FRONTEND_URL in backend `.env`
3. Restart backend server

### WebSocket connection failed

**Error**: `WebSocket connection failed`

**Solution**:
1. Check backend is running
2. Verify Socket.io server is initialized
3. Check browser console for errors
4. Test connection:
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
```

---

## Database Issues

### Table does not exist

**Error**: `relation "students" does not exist`

**Solution**:
```bash
# Run schema file
psql -U postgres -d alcovia_db -f server/database.sql

# Or in psql
\i server/database.sql
```

### Foreign key constraint violation

**Error**: `violates foreign key constraint`

**Solution**:
1. Ensure student exists before creating logs
2. Check student_id matches
3. Reset database:
```sql
TRUNCATE daily_logs, interventions CASCADE;
DELETE FROM students WHERE student_id = '123';
-- Re-run database.sql
```

---

## n8n Issues

### Workflow not triggering

**Problem**: Backend calls webhook but nothing happens

**Solution**:
1. Check n8n dashboard → Executions
2. Verify workflow is **activated** (toggle on)
3. Check webhook URL matches backend .env
4. Test webhook in n8n:
   - Click "Execute Workflow"
   - Check "Webhook" node output

### Email not sending

**Problem**: Workflow runs but no email received

**Solution**:
1. Check email credentials in n8n
2. Verify SMTP settings:
   - Gmail: smtp.gmail.com:587
   - Use App Password, not regular password
3. Check spam folder
4. Test email node separately

### Wait node not resuming

**Problem**: Workflow stuck at Wait node

**Solution**:
1. Check resume webhook URL
2. Verify mentor clicks correct link
3. Test resume webhook:
```bash
curl -X POST RESUME_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123","task":"Test task"}'
```

---

## Deployment Issues

### Vercel build fails

**Error**: `Build failed`

**Solution**:
1. Check build logs in Vercel dashboard
2. Verify package.json scripts
3. Check environment variables
4. Test build locally:
```bash
cd client
npm run build
```

### Render deployment fails

**Error**: `Deploy failed`

**Solution**:
1. Check Render logs
2. Verify start command: `npm start`
3. Check environment variables
4. Ensure package.json has correct scripts

### Supabase connection timeout

**Error**: `Connection timeout`

**Solution**:
1. Check Supabase project is active
2. Verify connection string
3. Check IP allowlist (should allow all)
4. Test connection:
```bash
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

---

## Testing Issues

### Can't reproduce intervention flow

**Problem**: App doesn't lock after failed check-in

**Solution**:
1. Check backend logs for errors
2. Verify Logic Gate thresholds:
   - Quiz score must be ≤ 7
   - Focus minutes must be ≤ 60
3. Check database:
```sql
SELECT status FROM students WHERE student_id = '123';
```

### Real-time unlock not working

**Problem**: App doesn't unlock after mentor assigns task

**Solution**:
1. Check WebSocket connection in browser console
2. Verify backend emits event:
```javascript
io.to(`student_${student_id}`).emit('intervention_assigned', data);
```
3. Check client is registered:
```javascript
socket.emit('register', studentId);
```
4. Fallback: Refresh page manually

---

## Performance Issues

### Slow API responses

**Problem**: Requests take > 2 seconds

**Solution**:
1. Check database indexes
2. Add connection pooling (already configured)
3. Monitor database queries
4. Add caching for student status

### High memory usage

**Problem**: Backend uses too much RAM

**Solution**:
1. Check for memory leaks
2. Limit connection pool size
3. Close database connections properly
4. Monitor with:
```bash
# Node.js memory usage
node --inspect server.js
```

---

## Security Issues

### Environment variables exposed

**Problem**: .env file committed to Git

**Solution**:
1. Remove from Git:
```bash
git rm --cached .env
git commit -m "Remove .env"
git push
```
2. Add to .gitignore
3. Rotate all secrets (database password, API keys)

### SQL injection vulnerability

**Problem**: User input not sanitized

**Solution**:
- Always use parameterized queries:
```javascript
// ✅ Good
pool.query('SELECT * FROM students WHERE student_id = $1', [studentId]);

// ❌ Bad
pool.query(`SELECT * FROM students WHERE student_id = '${studentId}'`);
```

---

## Browser-Specific Issues

### Safari WebSocket issues

**Problem**: WebSocket doesn't connect in Safari

**Solution**:
1. Check Safari version (needs 13+)
2. Enable WebSocket in Safari settings
3. Use polling fallback

### Mobile browser issues

**Problem**: App doesn't work on mobile

**Solution**:
1. Check responsive CSS
2. Test viewport meta tag
3. Use Chrome DevTools mobile emulator
4. Check touch events vs click events

---

## Quick Diagnostic Commands

### Check if backend is running
```bash
curl http://localhost:3001/health
```

### Check if database is accessible
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Check if frontend can reach backend
```bash
# In browser console
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
```

### Check WebSocket connection
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✅ Connected'));
socket.on('connect_error', (err) => console.log('❌ Error:', err));
```

---

## Getting Help

### Check Logs

**Backend**:
```bash
# Render
View logs in Render dashboard

# Local
Check terminal output
```

**Frontend**:
```bash
# Vercel
View logs in Vercel dashboard

# Local
Check browser console (F12)
```

**Database**:
```sql
-- Check recent logs
SELECT * FROM daily_logs ORDER BY logged_at DESC LIMIT 5;

-- Check student status
SELECT student_id, status, updated_at FROM students;
```

**n8n**:
- Dashboard → Executions
- Click on execution to see details
- Check each node's output

### Debug Mode

**Backend**:
```bash
# Add to server.js
console.log('Request:', req.body);
console.log('Response:', response);
```

**Frontend**:
```javascript
// Add to App.js
console.log('State:', studentData);
console.log('WebSocket:', socket.connected);
```

---

## Still Stuck?

1. **Read error messages carefully** - They usually tell you what's wrong
2. **Check all environment variables** - Most issues are config-related
3. **Test components independently** - Isolate the problem
4. **Review documentation** - README, DEPLOYMENT, TESTING guides
5. **Check GitHub Issues** - Someone might have had same problem

---

## Emergency Reset

If everything is broken, start fresh:

```bash
# Backend
cd server
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json build
npm install

# Database
psql -U postgres
DROP DATABASE alcovia_db;
CREATE DATABASE alcovia_db;
\c alcovia_db
\i server/database.sql

# Restart everything
cd server && npm start
cd client && npm start
```

---

**Remember**: Most issues are simple configuration problems. Check your .env files first!
