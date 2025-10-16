/*
  # Add Facility History and Paydown Tracking

  ## Description
  This migration adds comprehensive facility history tracking and facility paydown functionality.

  ## Changes
  
  1. Add facility history table
     - Track all changes to facility limit (upsizes and downsizes)
     - Track facility paydowns
     - Full audit trail with timestamps
  
  2. Update facility_transactions types
     - Add 'paydown' transaction type for when facility principal is paid down
  
  3. Create trigger for automatic facility history
     - Auto-log when facility_limit changes on lender_facilities table
  
  ## New Tables
  - facility_history: Tracks all facility limit changes and paydowns
  
  ## Security
  - Enable RLS on facility_history
  - Add policies for authenticated users
*/

-- Create facility history table
CREATE TABLE IF NOT EXISTS facility_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES lender_facilities(id) ON DELETE CASCADE,
  change_date date NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('limit_increase', 'limit_decrease', 'paydown', 'created')),
  previous_limit numeric,
  new_limit numeric,
  amount numeric,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_facility_history_facility_id ON facility_history(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_history_date ON facility_history(change_date);

-- Enable RLS
ALTER TABLE facility_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view facility history"
  ON facility_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert facility history"
  ON facility_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update facility history"
  ON facility_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete facility history"
  ON facility_history FOR DELETE
  TO authenticated
  USING (true);

-- Update facility_transactions to support paydown type
ALTER TABLE facility_transactions 
DROP CONSTRAINT IF EXISTS facility_transactions_type_check;

ALTER TABLE facility_transactions 
ADD CONSTRAINT facility_transactions_type_check 
CHECK (type IN ('draw', 'repayment', 'fee', 'interest', 'paydown'));

-- Function to track facility limit changes
CREATE OR REPLACE FUNCTION track_facility_limit_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if limit actually changed
  IF OLD.facility_limit IS DISTINCT FROM NEW.facility_limit THEN
    INSERT INTO facility_history (
      facility_id,
      change_date,
      change_type,
      previous_limit,
      new_limit,
      note
    ) VALUES (
      NEW.id,
      CURRENT_DATE,
      CASE 
        WHEN NEW.facility_limit > OLD.facility_limit THEN 'limit_increase'
        ELSE 'limit_decrease'
      END,
      OLD.facility_limit,
      NEW.facility_limit,
      'Facility limit changed from ' || OLD.facility_limit || ' to ' || NEW.facility_limit
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for facility limit changes
DROP TRIGGER IF EXISTS trigger_track_facility_limit_change ON lender_facilities;
CREATE TRIGGER trigger_track_facility_limit_change
  AFTER UPDATE ON lender_facilities
  FOR EACH ROW
  WHEN (OLD.facility_limit IS DISTINCT FROM NEW.facility_limit)
  EXECUTE FUNCTION track_facility_limit_change();

-- Function to create facility history entry when paydown occurs
CREATE OR REPLACE FUNCTION track_facility_paydown()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track paydown transactions
  IF NEW.type = 'paydown' THEN
    INSERT INTO facility_history (
      facility_id,
      change_date,
      change_type,
      amount,
      note
    ) VALUES (
      NEW.facility_id,
      NEW.date,
      'paydown',
      NEW.amount,
      'Facility paydown: ' || COALESCE(NEW.note, '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for facility paydowns
DROP TRIGGER IF EXISTS trigger_track_facility_paydown ON facility_transactions;
CREATE TRIGGER trigger_track_facility_paydown
  AFTER INSERT ON facility_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'paydown')
  EXECUTE FUNCTION track_facility_paydown();

-- Add helpful comments
COMMENT ON TABLE facility_history IS 'Tracks all facility limit changes and paydowns for audit trail';
COMMENT ON FUNCTION track_facility_limit_change() IS 'Automatically logs facility limit increases and decreases';
COMMENT ON FUNCTION track_facility_paydown() IS 'Automatically logs facility paydown transactions';
