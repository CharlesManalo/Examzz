# Supabase Migration Guide for Examzz

This guide will help you migrate your Examzz app from localStorage to Supabase database.

## 🚀 **Setup Instructions**

### **1. Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/login with GitHub
4. Create new project:
   - **Organization**: Your name/company
   - **Project Name**: `examzz-app`
   - **Database Password**: Generate a strong password
   - **Region**: Choose "Southeast Asia (Singapore)" for better performance in Philippines
5. Click "Create new project"

### **2. Get Your Credentials**

Once your project is ready, go to **Settings > API** and copy:

```bash
# Add these to your .env file
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **3. Run Database Schema**

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- ✅ All tables (users, quizzes, questions, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Database functions and triggers
- ✅ Indexes for performance

### **4. Update Environment Variables**

Create/update your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PayMongo Configuration  
VITE_PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...

# App Configuration
VITE_APP_NAME=Examzz
VITE_APP_URL=http://localhost:5173
```

### **5. Test the Migration**

Start your development server:

```bash
npm run dev
```

Test these features:
- ✅ User registration (passwords now hashed!)
- ✅ User login
- ✅ Quiz creation
- ✅ File upload
- ✅ Subscription system

## 📊 **What Changed**

### **Security Improvements**
- ✅ **Password hashing** with bcrypt (no more plain text!)
- ✅ **Row Level Security** - Users can only access their own data
- ✅ **SQL injection protection** - Supabase handles this automatically
- ✅ **Secure authentication** - No more session hijacking

### **Data Structure**
- ✅ **Real PostgreSQL database** - Scalable and reliable
- ✅ **Automatic backups** - Data protection included
- ✅ **Cross-device sync** - Same account on multiple devices
- ✅ **Real-time updates** - Live subscription status

### **Performance**
- ✅ **Faster queries** - Database indexes
- ✅ **Better caching** - Supabase edge caching
- ✅ **Scalable storage** - 500MB free tier
- ✅ **API limits** - 50,000 users/month free

## 🔧 **Database Schema Overview**

### **Main Tables**

```sql
users              -- User accounts with hashed passwords
uploaded_files     -- File uploads (PDF, DOCX, etc.)
quizzes            -- Quiz metadata
questions          -- Quiz questions
quiz_results       -- Quiz results and scores
subscriptions      -- PayMongo subscription data
payment_transactions -- Payment history
usage_tracking     -- Daily usage limits
user_analytics     -- User statistics
```

### **Security Features**

```sql
-- Row Level Security (RLS)
- Users can only see their own data
- Public quizzes are visible to everyone
- Admin access through service role key
- Automatic user isolation
```

### **Database Functions**

```sql
-- Helper functions
can_create_more_quizzes()  -- Check daily limits
can_upload_more_files()   -- Check file upload limits
get_user_limits()          -- Get subscription limits
handle_new_user()          -- Setup new user data
```

## 🚀 **Deployment Steps**

### **1. Update Netlify Environment**

In Netlify dashboard:

1. Go to **Site settings > Environment variables**
2. Add your Supabase credentials
3. Add PayMongo credentials
4. Redeploy your site

### **2. Update PayMongo Webhooks**

1. Go to PayMongo dashboard
2. Update webhook URL to: `https://your-site.netlify.app/.netlify/functions/paymongo-webhook`
3. Test webhook endpoint

### **3. Test Production**

- ✅ User registration/login
- ✅ Quiz creation and taking
- ✅ File uploads
- ✅ PayMongo subscription flow
- ✅ Subscription management

## 📈 **Benefits Achieved**

### **Security**
- ✅ **No more plain text passwords**
- ✅ **Professional authentication**
- ✅ **Data isolation between users**
- ✅ **Compliance ready**

### **Scalability**
- ✅ **50,000 users/month** free tier
- ✅ **500MB database storage**
- ✅ **Automatic backups**
- ✅ **Global CDN**

### **Features**
- ✅ **Real-time subscriptions**
- ✅ **Cross-device sync**
- ✅ **Advanced analytics**
- ✅ **Payment tracking**

## 🛠️ **Troubleshooting**

### **Common Issues**

**Error: "Invalid JWT"**
- Check your `VITE_SUPABASE_ANON_KEY` is correct
- Ensure environment variables are set in Netlify

**Error: "Row Level Security violation"**
- User must be logged in to access data
- Check RLS policies in Supabase

**Error: "Database connection failed"**
- Verify Supabase project is active
- Check service role key in Netlify functions

### **Getting Help**

1. Check Supabase logs: **Settings > Logs**
2. Check Netlify function logs
3. Verify environment variables
4. Test database queries in SQL Editor

## 🎯 **Next Steps**

1. **Test thoroughly** in development
2. **Deploy to Netlify** 
3. **Monitor performance** in Supabase dashboard
4. **Set up alerts** for database usage

Your Examzz app is now production-ready with enterprise-grade security and scalability! 🎉
