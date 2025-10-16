/*
  # Add Interest Due Transaction Type

  ## Description
  This migration adds 'interest_due' as a transaction type to allow lenders to 
  record when interest is owed (invoiced) separately from when payment is received.

  ## Changes
  1. Update the transaction type constraint to include 'interest_due'
  
  ## Workflow
  - 'interest_due': Records that interest has been calculated and is now owed by borrower
  - 'interest_payment': Records when the borrower pays the interest due
  - 'interest': Legacy type for when interest is posted directly (can still be used)

  ## Important Notes
  - This allows proper tracking of accounts receivable for interest
  - Statements and invoices will reflect interest due vs interest paid
  - Balance calculations need to account for interest_due as a debit
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_type_check' 
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
  END IF;
END $$;

-- Add updated constraint with interest_due
ALTER TABLE transactions 
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('advance', 'repayment', 'interest', 'interest_due', 'fee', 'interest_payment', 'fee_payment'));
