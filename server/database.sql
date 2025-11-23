-- Alcovia Intervention Engine Database Schema

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    status VARCHAR(50) DEFAULT 'On Track',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    quiz_score INTEGER NOT NULL,
    focus_minutes INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    task_description TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    mentor_notes TEXT
);

-- Insert sample student for testing
INSERT INTO students (student_id, name, email, status) 
VALUES ('123', 'John Doe', 'student@example.com', 'On Track')
ON CONFLICT (student_id) DO NOTHING;
