/*
  # Add Interest Frequency to Loans

  1. Changes
    - Add `interest_frequency` column to `loans` table to track whether interest is charged monthly or quarterly
    - Default value is 'monthly' for backward compatibility
    - Allowed values: 'monthly', 'quarterly'

  2. Security
    - No RLS changes needed - inherits existing policies on loans table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'interest_frequency'
  ) THEN
    ALTER TABLE loans ADD COLUMN interest_frequency text DEFAULT 'monthly';
    ALTER TABLE loans ADD CONSTRAINT interest_frequency_check 
      CHECK (interest_frequency IN ('monthly', 'quarterly'));
  END IF;
END $$;