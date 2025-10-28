-- Sun Tracking App Database Schema
-- This file contains the SQL commands to set up the database tables
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security (RLS) for all tables
-- Users table is automatically created by Supabase Auth

-- Saved locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES saved_locations(id) ON DELETE CASCADE,
  golden_hour_enabled BOOLEAN DEFAULT true,
  blue_hour_enabled BOOLEAN DEFAULT false,
  notification_minutes_before INTEGER DEFAULT 30 CHECK (notification_minutes_before >= 0 AND notification_minutes_before <= 1440),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_location_id ON notification_preferences(location_id);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_locations
-- Users can only access their own saved locations
CREATE POLICY "Users can view their own saved locations" ON saved_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved locations" ON saved_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved locations" ON saved_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved locations" ON saved_locations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
-- Users can only access their own notification preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER update_saved_locations_updated_at 
  BEFORE UPDATE ON saved_locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();