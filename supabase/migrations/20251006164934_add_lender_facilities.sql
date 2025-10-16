/*
  # Add Lender Facilities Support

  1. New Tables
    - `lender_facilities`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the lending facility/portfolio
      - `lender_name` (text) - Name of the lender/institution
      - `facility_limit` (numeric) - Maximum lending capacity
      - `current_utilization` (numeric) - Current amount deployed (computed)
      - `interest_rate_floor` (numeric) - Minimum interest rate
      - `origination_fee_pct` (numeric) - Origination fee percentage
      - `note` (text) - Additional notes
      - `status` (text) - active/inactive
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `facility_id` column to `loans` table
    - Add foreign key constraint from loans to lender_facilities

  3. Security
    - Enable RLS on `lender_facilities` table
    - Add policies for authenticated users
*/

-- Create lender_facilities table
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

-- Add facility_id to loans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on lender_facilities
ALTER TABLE lender_facilities ENABLE ROW LEVEL SECURITY;

-- Policies for lender_facilities
CREATE POLICY "Authenticated users can view facilities"
  ON lender_facilities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert facilities"
  ON lender_facilities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update facilities"
  ON lender_facilities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete facilities"
  ON lender_facilities
  FOR DELETE
  TO authenticated
  USING (true);
