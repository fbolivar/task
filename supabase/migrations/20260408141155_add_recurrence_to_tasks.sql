-- Add recurrence fields to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Index for efficient querying of recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring) WHERE is_recurring = TRUE;

COMMENT ON COLUMN tasks.is_recurring IS 'Whether the task repeats on a schedule';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'How often the task repeats: daily, weekly, biweekly, monthly';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Date after which no more recurrences are generated';
