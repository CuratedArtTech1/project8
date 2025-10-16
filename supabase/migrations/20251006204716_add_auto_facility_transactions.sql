/*
  # Automatic Facility Transaction Creation

  ## Description
  This migration adds automatic facility transaction creation when loan transactions occur.
  When a transaction is created on a loan that belongs to a facility, a corresponding
  facility transaction is automatically created.

  ## Changes
  
  1. Update facility_transactions table to support new transaction types
     - Add support for 'interest_payment' and 'fee_payment' types
  
  2. Add link between loan transactions and facility transactions
     - Add loan_transaction_id column to facility_transactions
  
  3. Create trigger function
     - Automatically creates facility transaction when loan transaction is created
     - Maps loan transaction types to appropriate facility transaction types
     - Only creates facility transaction if loan has a facility_id
  
  4. Create trigger
     - Fires after INSERT on transactions table
  
  ## Transaction Type Mapping
  - advance -> draw (money drawn from facility)
  - repayment -> repayment (principal paid back to facility)
  - interest -> interest (interest accrued, no facility impact)
  - fee -> fee (fee charged, no facility impact)
  - interest_payment -> interest (interest paid to facility)
  - fee_payment -> fee (fee paid to facility)
*/

-- Update facility_transactions to support all transaction types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facility_transactions' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE facility_transactions 
    DROP CONSTRAINT IF EXISTS facility_transactions_type_check;
    
    ALTER TABLE facility_transactions 
    ADD CONSTRAINT facility_transactions_type_check 
    CHECK (type IN ('draw', 'repayment', 'fee', 'interest'));
  END IF;
END $$;

-- Add loan_transaction_id to track which loan transaction created this facility transaction
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facility_transactions' 
    AND column_name = 'loan_transaction_id'
  ) THEN
    ALTER TABLE facility_transactions 
    ADD COLUMN loan_transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_facility_transactions_loan_transaction 
    ON facility_transactions(loan_transaction_id);
  END IF;
END $$;

-- Create function to automatically create facility transactions
CREATE OR REPLACE FUNCTION create_facility_transaction_from_loan()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_id uuid;
  v_facility_type text;
BEGIN
  -- Get the facility_id for this loan
  SELECT facility_id INTO v_facility_id
  FROM loans
  WHERE id = NEW.loan_id;
  
  -- Only proceed if loan has a facility
  IF v_facility_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Map loan transaction type to facility transaction type
  v_facility_type := CASE NEW.type
    WHEN 'advance' THEN 'draw'
    WHEN 'repayment' THEN 'repayment'
    WHEN 'interest_payment' THEN 'interest'
    WHEN 'fee_payment' THEN 'fee'
    ELSE NULL
  END;
  
  -- Only create facility transaction for types that affect the facility
  -- (advance, repayment, interest_payment, fee_payment)
  -- Skip: interest (just accrual), fee (just accrual)
  IF v_facility_type IS NOT NULL THEN
    INSERT INTO facility_transactions (
      facility_id,
      date,
      type,
      amount,
      note,
      loan_transaction_id
    ) VALUES (
      v_facility_id,
      NEW.date,
      v_facility_type,
      NEW.amount,
      'Auto-generated from loan transaction: ' || COALESCE(NEW.note, ''),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_facility_transaction ON transactions;
CREATE TRIGGER trigger_create_facility_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_facility_transaction_from_loan();

-- Add helpful comment
COMMENT ON FUNCTION create_facility_transaction_from_loan() IS 
'Automatically creates a facility transaction when a loan transaction is created. Only applies to loans with a facility_id and for transaction types that affect the facility balance.';
