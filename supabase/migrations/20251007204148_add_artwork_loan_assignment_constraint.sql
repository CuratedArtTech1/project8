/*
  # Add Artwork Loan Assignment Constraint

  ## Changes
  1. Add unique constraint to loan_artworks to ensure one artwork can only be assigned to one active loan
  2. Create function to check for active loan assignments before allowing new assignments
  3. Add trigger to enforce single-loan-per-artwork rule

  ## Important Notes
  - This prevents artworks from being assigned to multiple active loans simultaneously
  - Artworks can be reassigned once a loan is paid off or closed
  - The constraint only applies to active loans
*/

-- Drop existing constraint if any
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'loan_artworks_artwork_id_key'
  ) THEN
    ALTER TABLE loan_artworks DROP CONSTRAINT loan_artworks_artwork_id_key;
  END IF;
END $$;

-- Create function to check if artwork is already assigned to an active loan
CREATE OR REPLACE FUNCTION check_artwork_single_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if artwork is already assigned to another active loan
  IF EXISTS (
    SELECT 1 
    FROM loan_artworks la
    JOIN loans l ON la.loan_id = l.id
    WHERE la.artwork_id = NEW.artwork_id
      AND la.loan_id != NEW.loan_id
      AND l.status IN ('active', 'draft')
  ) THEN
    RAISE EXCEPTION 'Artwork is already assigned to another active loan. Artworks can only be assigned to one loan at a time.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single loan per artwork
DROP TRIGGER IF EXISTS enforce_single_loan_per_artwork ON loan_artworks;
CREATE TRIGGER enforce_single_loan_per_artwork
  BEFORE INSERT OR UPDATE ON loan_artworks
  FOR EACH ROW
  EXECUTE FUNCTION check_artwork_single_loan();

-- Add index to improve performance of the check
CREATE INDEX IF NOT EXISTS idx_loan_artworks_artwork_loan 
ON loan_artworks(artwork_id, loan_id);
