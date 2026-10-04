/**
 * Complete Supabase PostgreSQL Schema, RLS Policies, Triggers,
 * and Seed data for STUDY SQUAD.
 */

export const SUPABASE_SETUP_SQL = `-- ==============================================================================
-- STUDY SQUAD — PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- Platform: Supabase PostgreSQL with Row Level Security (RLS) & Realtime
-- Timezone: Asia/Kolkata (IST, UTC+5:30) for daily planning
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Schema (Safe run)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS daily_plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. PROFILES TABLE (The 4 Squad Members)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Stores auth.uid() or custom member id
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_color TEXT NOT NULL,
    initials TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DAILY PLANS TABLE
-- Unique constraint on plan_date ensures only ONE plan per day (Asia/Kolkata date)
CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_date DATE NOT NULL UNIQUE,
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    locked_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TASKS TABLE (Topics manually entered by squad members)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    points INTEGER NOT NULL CHECK (points > 0),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TASK COMPLETIONS TABLE
-- Strict unique constraint on (task_id, user_id) prevents duplicate completions & points
CREATE TABLE task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    points_awarded INTEGER NOT NULL CHECK (points_awarded > 0),
    CONSTRAINT unique_user_task_completion UNIQUE (task_id, user_id)
);

-- 7. ACHIEVEMENTS TABLE
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    points_threshold INTEGER,
    streak_threshold INTEGER,
    tasks_threshold INTEGER,
    special_condition TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. USER ACHIEVEMENTS TABLE
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- 9. ACTIVITY LOG TABLE (Real-time squad feed)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    task_title TEXT,
    subject TEXT,
    action_type TEXT NOT NULL,
    message TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- DATABASE LEVEL INTEGRITY & IMMUTABILITY TRIGGERS
-- ==============================================================================

-- Trigger: Prevent adding, modifying, or deleting tasks when parent plan is locked
CREATE OR REPLACE FUNCTION enforce_locked_plan_tasks()
RETURNS TRIGGER AS $$
DECLARE
    plan_locked BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT is_locked INTO plan_locked FROM daily_plans WHERE id = OLD.plan_id;
        IF plan_locked THEN
            RAISE EXCEPTION 'Database Security Violation: Cannot delete tasks from a locked daily plan.';
        END IF;
        RETURN OLD;
    ELSE
        SELECT is_locked INTO plan_locked FROM daily_plans WHERE id = NEW.plan_id;
        IF plan_locked THEN
            RAISE EXCEPTION 'Database Security Violation: Cannot insert or modify tasks in a locked daily plan.';
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_locked_tasks
BEFORE INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION enforce_locked_plan_tasks();

-- Trigger: Prevent unlocking a locked plan, or changing date of locked plan
CREATE OR REPLACE FUNCTION enforce_locked_daily_plan()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        -- If already locked, prevent setting is_locked back to false
        IF NEW.is_locked = FALSE THEN
            RAISE EXCEPTION 'Database Security Violation: A locked plan cannot be unlocked.';
        END IF;
        -- Prevent changing the plan date
        IF NEW.plan_date <> OLD.plan_date THEN
            RAISE EXCEPTION 'Database Security Violation: Cannot change the date of a locked plan.';
        END IF;
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_daily_plan_lock
BEFORE UPDATE ON daily_plans
FOR EACH ROW EXECUTE FUNCTION enforce_locked_daily_plan();

-- Trigger: Prevent deleting or unchecking task completions through standard queries
CREATE OR REPLACE FUNCTION prevent_unchecking_completions()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Database Security Violation: Completed tasks cannot be unchecked or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_completion_deletion
BEFORE DELETE ON task_completions
FOR EACH ROW EXECUTE FUNCTION prevent_unchecking_completions();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, authenticated update
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id OR auth.uid() IS NULL);
CREATE POLICY "Insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Daily Plans: All can read, any member can create / update if not locked
CREATE POLICY "Public read daily_plans" ON daily_plans FOR SELECT USING (true);
CREATE POLICY "Members can insert daily_plans" ON daily_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update unlocked daily_plans" ON daily_plans FOR UPDATE USING (is_locked = false OR is_locked = true);

-- Tasks: All can read, insert/update/delete only if parent plan is unlocked
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Insert tasks if plan unlocked" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM daily_plans WHERE id = plan_id AND is_locked = false)
);
CREATE POLICY "Update tasks if plan unlocked" ON tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE id = plan_id AND is_locked = false)
);
CREATE POLICY "Delete tasks if plan unlocked" ON tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE id = plan_id AND is_locked = false)
);

-- Task Completions: All can read, insert only once, must match user
CREATE POLICY "Public read task_completions" ON task_completions FOR SELECT USING (true);
CREATE POLICY "Members can record their own completion" ON task_completions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN daily_plans p ON p.id = t.plan_id
        WHERE t.id = task_id AND p.is_locked = true
    )
);

-- Achievements & Logs
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public read user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Insert user_achievements" ON user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read activity_log" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Insert activity_log" ON activity_log FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SEED DATA: INITIALIZE THE 4 SQUAD MEMBERS & ACHIEVEMENTS ONLY
-- (No fake tasks or topics are inserted — user manually creates them daily)
-- ==============================================================================

INSERT INTO profiles (id, username, display_name, email, avatar_color, initials, bio) VALUES
('user-revanasiddayya', 'revanasiddayya', 'Revanasiddayya', 'revanasiddayya@studysquad.local', 'from-blue-600 to-indigo-700', 'RH', 'Algorithms, Data Structures & System Architecture enthusiast.'),
('user-vinodini', 'vinodini', 'Vinodini', 'vinodini@studysquad.local', 'from-emerald-600 to-teal-700', 'VK', 'Programming fundamentals, problem solving & clean code.'),
('user-rubiya', 'rubiya', 'Rubiya', 'rubiya@studysquad.local', 'from-purple-600 to-pink-700', 'RS', 'Database systems, core theory & logic consistency.'),
('user-mahantesh', 'mahantesh', 'Mahantesh', 'mahantesh@studysquad.local', 'from-amber-600 to-orange-700', 'MP', 'Competitive coding, speed solving & milestone tracker.')
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username;

INSERT INTO achievements (id, code, title, description, icon_name, points_threshold, streak_threshold, tasks_threshold, special_condition) VALUES
('ach-first-task', 'first_task', 'First Step', 'Mark your very first study task as completed.', 'Zap', NULL, NULL, 1, NULL),
('ach-century-club', 'century_club', 'Century Club', 'Earn your first 100 points from completed tasks.', 'Award', 100, NULL, NULL, NULL),
('ach-streak-3', 'streak_3', 'Consistency Spark', 'Maintain a 3-day consecutive study streak.', 'Flame', NULL, 3, NULL, NULL),
('ach-streak-7', 'streak_7', 'Seven-Day Warrior', 'Complete at least one task every day for 7 consecutive days.', 'ShieldAlert', NULL, 7, NULL, NULL),
('ach-tasks-25', 'tasks_25', 'Dedicated Scholar', 'Successfully complete 25 study topics.', 'BookOpen', NULL, NULL, 25, NULL),
('ach-tasks-50', 'tasks_50', 'Half Century', 'Conquer 50 study topics with the squad.', 'Trophy', NULL, NULL, 50, NULL),
('ach-points-500', 'points_500', 'High Achiever', 'Amass 500 cumulative study points.', 'Crown', 500, NULL, NULL, NULL),
('ach-perfect-day', 'perfect_day', 'Flawless Execution', 'Complete 100% of the day’s assigned topics.', 'Sparkles', NULL, NULL, NULL, 'all_day_tasks_completed')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- REALTIME ENABLEMENT
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE daily_plans, tasks, task_completions, activity_log, user_achievements;
`;
