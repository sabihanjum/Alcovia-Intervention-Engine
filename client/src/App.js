import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const STUDENT_ID = '123'; // Hardcoded for demo

function App() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState('');
  const [focusMinutes, setFocusMinutes] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timerFailed, setTimerFailed] = useState(false);
  
  const socketRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    fetchStudentData();
    
    // Setup WebSocket connection
    socketRef.current = io(API_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
      socketRef.current.emit('register', STUDENT_ID);
    });

    socketRef.current.on('intervention_assigned', (data) => {
      console.log('Intervention assigned:', data);
      setMessage('🔓 Mentor has assigned you a task!');
      fetchStudentData();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Tab visibility detection for cheater detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning && !timerFailed) {
        setTabSwitchCount(prev => prev + 1);
        setTimerFailed(true);
        setIsTimerRunning(false);
        clearInterval(timerIntervalRef.current);
        setMessage('⚠️ Timer failed! Tab switching detected. Session penalty applied.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerRunning, timerFailed]);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/student/${STUDENT_ID}`);
      setStudentData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
    setTimerFailed(false);
    setMessage('Focus timer started! Stay on this tab.');
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    const minutes = Math.floor(timerSeconds / 60);
    setFocusMinutes(minutes.toString());
    setMessage(`Timer stopped. You focused for ${minutes} minutes.`);
  };

  const handleSubmitCheckin = async (e) => {
    e.preventDefault();
    
    if (!quizScore || !focusMinutes) {
      setMessage('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/daily-checkin`, {
        student_id: STUDENT_ID,
        quiz_score: parseInt(quizScore),
        focus_minutes: parseInt(focusMinutes)
      });

      setMessage(response.data.message);
      setQuizScore('');
      setFocusMinutes('');
      setTimerSeconds(0);
      
      setTimeout(() => {
        fetchStudentData();
      }, 1000);
    } catch (error) {
      setMessage('Error submitting check-in. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteIntervention = async () => {
    if (!studentData.pendingIntervention) return;

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/complete-intervention`, {
        student_id: STUDENT_ID,
        intervention_id: studentData.pendingIntervention.id
      });

      setMessage(response.data.message);
      setTimeout(() => {
        fetchStudentData();
      }, 1000);
    } catch (error) {
      setMessage('Error completing task. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  const { student, pendingIntervention } = studentData;
  const status = student.status;

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎓 Alcovia Focus Mode</h1>
          <div className="student-info">
            <p><strong>{student.name}</strong></p>
            <p className={`status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
              {status}
            </p>
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes('⚠️') || message.includes('attention') ? 'warning' : 'success'}`}>
            {message}
          </div>
        )}

        {/* LOCKED STATE */}
        {status === 'Needs Intervention' && (
          <div className="locked-state">
            <div className="lock-icon">🔒</div>
            <h2>Analysis in Progress</h2>
            <p>Your recent performance needs attention.</p>
            <p className="waiting">Waiting for Mentor...</p>
            <div className="spinner"></div>
          </div>
        )}

        {/* REMEDIAL STATE */}
        {status === 'Remedial Task' && pendingIntervention && (
          <div className="remedial-state">
            <div className="task-icon">📚</div>
            <h2>Remedial Task Assigned</h2>
            <div className="task-card">
              <h3>Your Task:</h3>
              <p className="task-description">{pendingIntervention.task_description}</p>
              {pendingIntervention.mentor_notes && (
                <div className="mentor-notes">
                  <strong>Mentor Notes:</strong>
                  <p>{pendingIntervention.mentor_notes}</p>
                </div>
              )}
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleCompleteIntervention}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Mark Complete'}
            </button>
          </div>
        )}

        {/* NORMAL STATE */}
        {status === 'On Track' && (
          <div className="normal-state">
            <div className="timer-section">
              <h2>Focus Timer</h2>
              <div className="timer-display">
                {formatTime(timerSeconds)}
              </div>
              {timerFailed && (
                <p className="timer-warning">⚠️ Session failed due to tab switching</p>
              )}
              <div className="timer-controls">
                {!isTimerRunning ? (
                  <button className="btn btn-primary" onClick={startTimer}>
                    Start Focus Timer
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={stopTimer}>
                    Stop Timer
                  </button>
                )}
              </div>
            </div>

            <div className="checkin-section">
              <h2>Daily Check-in</h2>
              <form onSubmit={handleSubmitCheckin}>
                <div className="form-group">
                  <label>Quiz Score (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={quizScore}
                    onChange={(e) => setQuizScore(e.target.value)}
                    placeholder="Enter your quiz score"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Focus Minutes</label>
                  <input
                    type="number"
                    min="0"
                    value={focusMinutes}
                    onChange={(e) => setFocusMinutes(e.target.value)}
                    placeholder="Enter focus time in minutes"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Check-in'}
                </button>
              </form>
              <div className="requirements">
                <p><strong>Requirements to stay on track:</strong></p>
                <ul>
                  <li>Quiz Score &gt; 7</li>
                  <li>Focus Time &gt; 60 minutes</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Alcovia Intervention Engine • Real-time Mentorship System</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
