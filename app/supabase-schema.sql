-- Examzz Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_premium BOOLEAN DEFAULT FALSE,
    paymongo_customer_id VARCHAR(255),  
    subscription_status VARCHAR(50) DEFAULT 'free',
    plan_type VARCHAR(20) DEFAULT 'free',
    subscription_id VARCHAR(255),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- Uploaded files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'xlsx')),
    file_size BIGINT NOT NULL,
    extracted_text TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500),
    mime_type VARCHAR(100)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('quiz', 'mock-exam', 'full-exam', 'lesson-review')),
    title VARCHAR(255) NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_ids UUID[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer < 4),
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('definition', 'fill-blank', 'keyword', 'multiple-choice')),
    explanation TEXT,
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    correct_answers INTEGER NOT NULL,
    wrong_answers INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER NOT NULL, -- in seconds
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (score) STORED,
    passed BOOLEAN GENERATED ALWAYS AS (score >= 60.0) STORED
);

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quizzes_created INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    average_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    quizzes_today INTEGER DEFAULT 0,
    files_uploaded_today INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Subscriptions table (for PayMongo integration)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'premium',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    paymongo_subscription_id VARCHAR(255) UNIQUE,
    paymongo_customer_id VARCHAR(255) NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10,2) NOT NULL DEFAULT 95.00,
    currency VARCHAR(3) DEFAULT 'PHP'
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    paymongo_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_paymongo_customer ON users(paymongo_customer_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paymongo_id ON payment_transactions(paymongo_payment_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Files policies
CREATE POLICY "Users can view own files" ON uploaded_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON uploaded_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON uploaded_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON uploaded_files FOR DELETE USING (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Users can view own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public quizzes" ON quizzes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quizzes" ON quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quizzes" ON quizzes FOR DELETE USING (auth.uid() = user_id);

-- Questions policies (inherited from quizzes)
CREATE POLICY "Users can view questions from accessible quizzes" ON questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = questions.quiz_id 
        AND (quizzes.user_id = auth.uid() OR quizzes.is_public = true)
    )
);
CREATE POLICY "Users can manage questions from own quizzes" ON questions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = questions.quiz_id 
        AND quizzes.user_id = auth.uid()
    )
);

-- Quiz results policies
CREATE POLICY "Users can view own results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON quiz_results FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own analytics" ON user_analytics FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own usage" ON usage_tracking FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create usage tracking for new user
  INSERT INTO usage_tracking (user_id, date)
  VALUES (NEW.id, CURRENT_DATE);
  
  -- Create user analytics for new user
  INSERT INTO user_analytics (user_id, date)
  VALUES (NEW.id, CURRENT_DATE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user limits based on subscription
CREATE OR REPLACE FUNCTION public.get_user_limits(user_uuid UUID)
RETURNS TABLE(
  quizzes_per_day INTEGER,
  file_uploads INTEGER,
  max_file_size_mb INTEGER,
  features TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.plan_type = 'premium' THEN 999999 -- Unlimited
      ELSE 15
    END as quizzes_per_day,
    CASE 
      WHEN u.plan_type = 'premium' THEN 15
      ELSE 10
    END as file_uploads,
    CASE 
      WHEN u.plan_type = 'premium' THEN 50
      ELSE 10
    END as max_file_size_mb,
    CASE 
      WHEN u.plan_type = 'premium' THEN ARRAY['unlimited-quizzes', 'no-ads', 'advanced-analytics', 'priority-support']
      ELSE ARRAY['basic-quizzes', 'ads-supported']
    END as features
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can create more quizzes today
CREATE OR REPLACE FUNCTION public.can_create_more_quizzes(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_limit INTEGER;
  used_today INTEGER;
BEGIN
  -- Get user's daily limit
  SELECT quizzes_per_day INTO current_limit
  FROM public.get_user_limits(user_uuid);
  
  -- Get today's usage
  SELECT COALESCE(quizzes_today, 0) INTO used_today
  FROM usage_tracking
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Return if user can create more
  RETURN used_today < current_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can upload more files today
CREATE OR REPLACE FUNCTION public.can_upload_more_files(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_limit INTEGER;
  used_today INTEGER;
BEGIN
  -- Get user's daily limit
  SELECT file_uploads INTO current_limit
  FROM public.get_user_limits(user_uuid);
  
  -- Get today's usage
  SELECT COALESCE(files_uploaded_today, 0) INTO used_today
  FROM usage_tracking
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Return if user can upload more
  RETURN used_today < current_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
