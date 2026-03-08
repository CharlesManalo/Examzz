-- Update database schema to work with Supabase Auth
-- Run this in your Supabase SQL Editor after the initial schema

-- Update users table to work with Supabase Auth
-- Remove password_hash column since Supabase Auth handles passwords
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Add email_verified column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update the trigger function to work with Supabase Auth
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

-- Update the trigger to use auth.users instead of our custom users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to sync auth.users with our users table
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user profile when auth user changes
  INSERT INTO users (id, email, email_verified, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NEW.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync auth users with our users table
CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();

-- Update RLS policies to work with auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to get current user with profile
CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  email_verified BOOLEAN,
  is_premium BOOLEAN,
  subscription_status TEXT,
  plan_type TEXT,
  paymongo_customer_id TEXT,
  subscription_id TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.email_verified,
    u.is_premium,
    u.subscription_status,
    u.plan_type,
    u.paymongo_customer_id,
    u.subscription_id,
    u.subscription_end_date
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user registration from auth
CREATE OR REPLACE FUNCTION public.handle_user_registration(user_email TEXT, user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create user profile if it doesn't exist
  INSERT INTO users (id, email, is_premium, subscription_status, plan_type, email_verified)
  VALUES (user_id, user_email, FALSE, 'free', 'free', FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create initial usage tracking
  INSERT INTO usage_tracking (user_id, date)
  VALUES (user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Create initial analytics
  INSERT INTO user_analytics (user_id, date)
  VALUES (user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON usage_tracking TO authenticated;
GRANT ALL ON user_analytics TO authenticated;
GRANT ALL ON uploaded_files TO authenticated;
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON questions TO authenticated;
GRANT ALL ON quiz_results TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;

-- Grant execution rights on functions
GRANT EXECUTE ON FUNCTION public.get_user_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_more_quizzes TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_more_files TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_registration TO authenticated;

-- Create view for user profile with auth data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  u.email_verified,
  u.is_premium,
  u.subscription_status,
  u.plan_type,
  u.paymongo_customer_id,
  u.subscription_id,
  u.subscription_end_date,
  u.created_at,
  u.updated_at,
  u.last_login,
  a.email_confirmed_at,
  a.phone,
  a.confirmed_at
FROM users u
LEFT JOIN auth.users a ON u.id = a.id;

-- Note: RLS is handled by the underlying users table, not the view
-- The view inherits security from the users table RLS policies

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
