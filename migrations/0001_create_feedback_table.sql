-- Migration: Create feedback table
-- Feature 2: Persistent Storage Layer

DROP TABLE IF EXISTS feedback;

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT,
  urgency INTEGER,
  image_key TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on urgency for fast sorting
CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(urgency DESC);

-- Create an index on timestamp for chronological queries
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp DESC);
