/*
  # Add Interest Rate History Tracking

  ## Description
  This migration adds the ability to track interest rate changes over time for loans.
  This allows for monthly (or any period) rate adjustments while maintaining a complete history.

  ## New Tables
  
  ### `interest_rate_changes`
  - `id` (uuid, primary key) - Unique identifier for each rate change
  - `loan_id` (uuid, foreign key) - References the loan this rate change applies to
  - `effective_date` (date) - The date this rate becomes effective
  - `rate_type` ('fixed' or 'floating') - Type of rate for this period
  - `fixed_apr` (numeric) - Fixed APR if rate_type is 'fixed'
  - `spread` (numeric) - Spread over prime if rate_type is 'floating'
  - `note` (text) - Optional note explaining the rate change
  - `created_at` (timestamptz) - When this record was created
  - `created_by` (uuid) - User who created this rate change (optional for now)

  ## Security
  - Enable RLS on the new table
  - Add policy for authenticated users to read rate changes
  - Add policy for authenticated users to create rate changes

  ## Important Notes
  - The current rate on the loan table remains the "current" rate
  - Historical rates are stored in this table
  - When calculating interest, the system should use the rate effective for that time period
*/

-- Create interest rate changes table
CREATE TABLE IF NOT EXISTS interest_rate_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  effective_date date NOT NULL,
  rate_type text NOT NULL CHECK (rate_type IN ('fixed', 'floating')),
  fixed_apr numeric DEFAULT 0,
  spread numeric DEFAULT 0,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for efficient querying by loan and date
CREATE INDEX IF NOT EXISTS idx_rate_changes_loan_date 
  ON interest_rate_changes(loan_id, effective_date DESC);

-- Enable RLS
ALTER TABLE interest_rate_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all rate changes
CREATE POLICY "Authenticated users can view rate changes"
  ON interest_rate_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert rate changes
CREATE POLICY "Authenticated users can insert rate changes"
  ON interest_rate_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update rate changes
CREATE POLICY "Authenticated users can update rate changes"
  ON interest_rate_changes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete rate changes
CREATE POLICY "Authenticated users can delete rate changes"
  ON interest_rate_changes
  FOR DELETE
  TO authenticated
  USING (true);