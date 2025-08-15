-- Seed data for ARC Mentor

-- Create a demo user
INSERT INTO users (id, name, level, xp, gold, hp, streak)
VALUES ('demo', 'Demo User', 1, 0, 0, 100, 0);

-- Sample quests for the demo user
INSERT INTO quests (user_id, title, description, status, xp, gold, difficulty, importance, deadline)
VALUES
  ('demo', 'Complete welcome quest', 'Read the ARC Mentor README and explore the dashboard.', 'todo', 10, 5, 'easy', 3, datetime('now', '+1 day')),
  ('demo', 'Sync your calendar', 'Click Check Calendar to import your next week of events.', 'todo', 8, 4, 'easy', 2, datetime('now', '+1 day'));
