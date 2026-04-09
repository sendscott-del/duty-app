-- Add avatar_url to profiles for profile pictures
ALTER TABLE duty_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
