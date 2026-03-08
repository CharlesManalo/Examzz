# Critical Bug Fixes Summary

## ✅ Bug 1 — `b.slice is not a function` in `createQuestions`

**Fixed in:** `app/src/services/supabase.ts` lines 374-380

**Problem:** The `options` field sometimes contained unexpected data types, causing `JSON.parse()` to crash when the data wasn't a string.

**Solution:** Added proper guard with try-catch:
```ts
options: (() => {
  if (Array.isArray(q.options)) return q.options;
  if (typeof q.options === 'string') {
    try { return JSON.parse(q.options); } catch { return []; }
  }
  return [];
})(),
```

## ✅ Bug 2 — 403 on questions insert — RLS policy missing `WITH CHECK`

**Fixed in:** `fix_rls_policy.sql` (run this in Supabase SQL editor)

**Problem:** RLS policy only had `USING` clause for SELECT operations, missing `WITH CHECK` for INSERT operations.

**Solution:** Added `WITH CHECK` clause to the policy:
```sql
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
```

## ✅ Bug 3 — Manual password hashing instead of Supabase Auth

**Fixed in:** `app/src/services/supabase.ts` lines 170-212

**Problem:** Manual password hashing with bcrypt bypassed Supabase Auth, causing `auth.uid()` to return null and all RLS policies to fail.

**Solution:** Replaced both `signUp` and `signIn` functions with proper Supabase Auth:

### signUp (lines 170-194):
```ts
export const signUp = async (
  email: string,
  password: string,
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  // Profile row is created automatically by your sync_user_profile trigger
  return mapDatabaseUser({
    id: data.user.id,
    email: data.user.email!,
    password_hash: "",
    created_at: data.user.created_at,
    updated_at: data.user.created_at,
    last_login: null,
    is_premium: false,
    paymongo_customer_id: null,
    subscription_status: "free",
    plan_type: "free",
    subscription_id: null,
    subscription_end_date: null,
    email_verified: false,
  });
};
```

### signIn (lines 196-212):
```ts
export const signIn = async (
  email: string,
  password: string,
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in failed");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  return mapDatabaseUser(profile);
};
```

**Additional:** Removed unused `bcrypt` import.

## 🚀 Next Steps

1. **Run the SQL migration:** Execute the contents of `fix_rls_policy.sql` in your Supabase SQL editor
2. **Test authentication:** Try signing up and signing in to ensure Supabase Auth works correctly
3. **Test question creation:** Verify that questions can be created without the `b.slice` error
4. **Verify RLS:** Confirm that users can only access their own data

## Root Cause Analysis

Bug 3 was the root cause of the 403 errors - without proper Supabase Auth, `auth.uid()` returned null, causing all RLS policies to fail. The manual password hashing completely bypassed Supabase's authentication system.

All three fixes work together to resolve the authentication and authorization issues in your application.
