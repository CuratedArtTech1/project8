/*
  # Add Loan Name Field

  1. Changes
    - Add `loan_name` column to `loans` table
    - This allows for human-readable loan identifiers based on borrower names
    
  2. Purpose
    - Make loans easier to identify in the UI
    - Provide custom naming for loans (e.g., "Smith Art Collection Loan 2024")
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'loan_name'
  ) THEN
    ALTER TABLE loans ADD COLUMN loan_name text DEFAULT '';
  END IF;
END $$;
