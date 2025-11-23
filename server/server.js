const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('register', (studentId) => {
    socket.join(`student_${studentId}`);
    console.log(`Student ${studentId} registered for real-time updates`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Alcovia Intervention Engine is running' });
});

// Get student status
app.get('/api/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  // Use mock data (database not configured)
  console.log('Using mock data for student:', studentId);
  const mockStudent = {
    id: 1,
    student_id: studentId,
    name: 'Demo Student',
    email: 'demo@alcovia.edu',
    status: 'On Track',
    created_at: new Date(),
    updated_at: new Date()
  };

  res.json({
    student: mockStudent,
    pendingIntervention: null
  });
});

// POST /daily-checkin - The Logic Gate
app.post('/api/daily-checkin', async (req, res) => {
  const { student_id, quiz_score, focus_minutes } = req.body;

  if (!student_id || quiz_score === undefined || focus_minutes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // The Logic Gate
  const isSuccess = quiz_score > 7 && focus_minutes > 60;
  
  console.log(`Check-in: Score=${quiz_score}, Focus=${focus_minutes}, Success=${isSuccess}`);

  if (isSuccess) {
    res.json({ status: 'On Track', message: 'Great job! Keep it up!' });
  } else {
    res.json({ 
      status: 'Pending Mentor Review', 
      message: 'Your performance needs attention. A mentor will review shortly.' 
    });
  }
});

// POST /assign-intervention - Called by n8n after mentor approval
app.post('/api/assign-intervention', async (req, res) => {
  try {
    const { student_id, task_description, mentor_notes } = req.body;

    if (!student_id || !task_description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create intervention record
    const result = await pool.query(
      'INSERT INTO interventions (student_id, task_description, mentor_notes, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, task_description, mentor_notes || '', 'Pending']
    );

    // Update student status to Remedial Task
    await pool.query(
      'UPDATE students SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2',
      ['Remedial Task', student_id]
    );

    // Emit real-time update via WebSocket
    io.to(`student_${student_id}`).emit('intervention_assigned', {
      intervention: result.rows[0]
    });

    res.json({ 
      success: true, 
      message: 'Intervention assigned successfully',
      intervention: result.rows[0]
    });
  } catch (error) {
    console.error('Error assigning intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /complete-intervention - Student marks task as complete
app.post('/api/complete-intervention', async (req, res) => {
  const { student_id, intervention_id } = req.body;

  if (!student_id || !intervention_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`Intervention ${intervention_id} completed for student ${student_id}`);

  res.json({ 
    success: true, 
    message: 'Task completed! You are back on track.',
    status: 'On Track'
  });
});

// GET /api/logs/:studentId - Get student's daily logs
app.get('/api/logs/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM daily_logs WHERE student_id = $1 ORDER BY logged_at DESC LIMIT 10',
      [studentId]
    );

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Alcovia Intervention Engine running on port ${PORT}`);
});
