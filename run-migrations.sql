-- Run this SQL in your Supabase SQL Editor to set up the complete database schema
-- Go to: https://supabase.com/dashboard/project/cgxmtazwfptjuqifeypn/sql/new

-- This combines all migrations in the correct order

-- Migration 1: Create art loan system (20251003190704)
-- (Run the contents of supabase/migrations/20251003190704_create_art_loan_system.sql)

-- Migration 2: Add lender facilities (20251006164934)
CREATE TABLE IF NOT EXISTS lender_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lender_name text NOT NULL,
  facility_limit numeric DEFAULT 0,
  interest_rate_floor numeric DEFAULT 0,
  origination_fee_pct numeric DEFAULT 0,
  note text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add facility_id to loans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE lender_facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for lender_facilities
CREATE POLICY "Allow authenticated users to view lender_facilities"
  ON lender_facilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert lender_facilities"
  ON lender_facilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update lender_facilities"
  ON lender_facilities FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete lender_facilities"
  ON lender_facilities FOR DELETE
  TO authenticated
  USING (true);
