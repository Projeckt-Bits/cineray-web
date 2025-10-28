# Supabase Setup Guide

This guide explains how to set up Supabase for the Sun Tracking App.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed locally

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in your project details:
   - **Name**: Sun Tracking App (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Once your project is created, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **Anon public key** (under "Project API keys")

## Step 3: Configure Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `src/lib/database-schema.sql`
3. Paste it into the SQL Editor and click "Run"

This will create:
- `saved_locations` table for storing user's saved locations
- `notification_preferences` table for managing notification settings
- Row Level Security (RLS) policies to ensure data privacy
- Indexes for better performance
- Triggers for automatic timestamp updates

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Configure your authentication settings:
   - **Site URL**: Set to your app's URL (e.g., `http://localhost:3000` for development)
   - **Redirect URLs**: Add your app's URL to the list of allowed redirect URLs

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should now be able to connect to Supabase. You can test this by:
   - Opening the browser console and checking for any Supabase connection errors
   - Trying to save a location (once the UI is implemented)

## Database Schema Overview

### saved_locations
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `name`: Location name (text)
- `latitude`: Decimal(10,8) with validation (-90 to 90)
- `longitude`: Decimal(11,8) with validation (-180 to 180)
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)

### notification_preferences
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `location_id`: References saved_locations(id)
- `golden_hour_enabled`: Boolean (default: true)
- `blue_hour_enabled`: Boolean (default: false)
- `notification_minutes_before`: Integer (0-1440, default: 30)
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)

## Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Input Validation**: Coordinate bounds checking
- **Automatic Cleanup**: Cascade deletes when users are removed

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Make sure `.env.local` exists and contains the correct values
   - Restart your development server after adding environment variables

2. **Database connection errors**
   - Verify your project URL and anon key are correct
   - Check that your Supabase project is active and not paused

3. **RLS policy errors**
   - Make sure you've run the database schema SQL
   - Verify that users are properly authenticated before accessing data

4. **CORS errors**
   - Add your domain to the allowed origins in Supabase dashboard
   - For development, make sure `http://localhost:3000` is allowed

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
- Review the browser console for specific error messages