/*
  # Add User Roles and Access Control

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `role` (text: 'admin' or 'user')
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamptz)

  2. Changes
    - Add user_profiles table to track user roles and access
    - Admin users can manage other users
    - Non-admin users must be active to access the system

  3. Security
    - Enable RLS on user_profiles table
    - Admins can view, create, update all user profiles
    - Users can view their own profile
    - Only admins can grant/revoke access and change roles

  4. Initial Data
    - Create admin profile for meghan@ccg-art.com
    - Create user profiles for existing users (valentina@ccg-art.com, jcoyne@stonecaps.com)
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can update user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

-- Function to check if user is active admin
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Insert profiles for existing users
DO $$
DECLARE
  meghan_id uuid;
  valentina_id uuid;
  jcoyne_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO meghan_id FROM auth.users WHERE email = 'meghan@ccg-art.com';
  SELECT id INTO valentina_id FROM auth.users WHERE email = 'valentina@ccg-art.com';
  SELECT id INTO jcoyne_id FROM auth.users WHERE email = 'jcoyne@stonecaps.com';

  -- Insert meghan as admin (if exists)
  IF meghan_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (meghan_id, 'meghan@ccg-art.com', 'admin', true, meghan_id)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
  END IF;

  -- Insert valentina as active user (if exists)
  IF valentina_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (valentina_id, 'valentina@ccg-art.com', 'user', true, meghan_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert jcoyne as active user (if exists)
  IF jcoyne_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (jcoyne_id, 'jcoyne@stonecaps.com', 'user', true, meghan_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
