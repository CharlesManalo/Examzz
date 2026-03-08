-- Fix RLS policy for questions table to include WITH CHECK clause
-- This resolves the 403 error when inserting questions

DROP POLICY IF EXISTS "Users can manage questions from own quizzes" ON questions;

CREATE POLICY "Users can manage questions from own quizzes" ON questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.user_id = auth.uid()
  )
);
