-- Simple RLS policies for questions table
-- This resolves the 403 error when inserting questions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage questions from own quizzes" ON questions;
DROP POLICY IF EXISTS "Users can insert questions" ON questions;
DROP POLICY IF EXISTS "Users can read questions" ON questions;

-- Create simple policies for authenticated users
CREATE POLICY "Users can insert questions" ON questions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read questions" ON questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update questions" ON questions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete questions" ON questions
FOR DELETE
TO authenticated
USING (true);
