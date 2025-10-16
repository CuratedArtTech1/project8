/*
  # Add Basis Points, Cents, and Audit Trail

  ## Changes to Settings Table
  1. Add `prime_rate_bps` (integer) - Prime rate in basis points (725 = 7.25%)
  2. Add `default_origination_fee_bps` (integer) - Default origination fee in basis points (200 = 2%)
  3. Add `currency` (text) - Default currency (USD)
  
  ## Changes to Loans Table
  1. Add `version` (integer) - Version tracking for optimistic locking
  2. Add `interest_rate_bps` (integer) - Computed interest rate in basis points
  3. Add `interest_rate_override_bps` (integer) - Optional override for interest rate
  4. Add `ltv_pct` (numeric) - Loan-to-value percentage
  5. Add `ltv_override_pct` (numeric) - Optional override for LTV
  6. Add `principal_cents` (bigint) - Principal amount in cents
  7. Add `principal_override_cents` (bigint) - Optional override for principal
  8. Add `prepaid_interest_months` (integer) - Number of months of prepaid interest
  9. Add `prepaid_fees_cents` (bigint) - Prepaid fees in cents
  10. Add `origination_fee_bps` (integer) - Origination fee in basis points
  11. Add `origination_fee_override_bps` (integer) - Optional override for origination fee
  12. Add `origination_fee_cents` (bigint) - Computed origination fee in cents
  13. Add `projected_funding_cents` (bigint) - Total projected funding in cents
  14. Add `override_reason` (text) - Reason for any overrides
  
  ## Changes to Transactions Table
  1. Add `request_id` (text) - Idempotency key for preventing duplicate transactions
  2. Add unique index on request_id for idempotency enforcement
  
  ## New ChangeLog Table
  1. Create comprehensive audit trail table
  2. Tracks all changes to entities with before/after values
  3. Records who made the change and when
  4. Includes reason for change
  
  ## Security
  - Enable RLS on changelog table
  - Add policies for authenticated users
*/

-- Settings table updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'prime_rate_bps'
  ) THEN
    ALTER TABLE settings ADD COLUMN prime_rate_bps integer DEFAULT 725;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'default_origination_fee_bps'
  ) THEN
    ALTER TABLE settings ADD COLUMN default_origination_fee_bps integer DEFAULT 200;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE settings ADD COLUMN currency text DEFAULT 'USD';
  END IF;
END $$;

-- Loans table updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'version'
  ) THEN
    ALTER TABLE loans ADD COLUMN version integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'interest_rate_bps'
  ) THEN
    ALTER TABLE loans ADD COLUMN interest_rate_bps integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'interest_rate_override_bps'
  ) THEN
    ALTER TABLE loans ADD COLUMN interest_rate_override_bps integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'ltv_pct'
  ) THEN
    ALTER TABLE loans ADD COLUMN ltv_pct numeric DEFAULT 45;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'ltv_override_pct'
  ) THEN
    ALTER TABLE loans ADD COLUMN ltv_override_pct numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'principal_cents'
  ) THEN
    ALTER TABLE loans ADD COLUMN principal_cents bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'principal_override_cents'
  ) THEN
    ALTER TABLE loans ADD COLUMN principal_override_cents bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'prepaid_interest_months'
  ) THEN
    ALTER TABLE loans ADD COLUMN prepaid_interest_months integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'prepaid_fees_cents'
  ) THEN
    ALTER TABLE loans ADD COLUMN prepaid_fees_cents bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'origination_fee_bps'
  ) THEN
    ALTER TABLE loans ADD COLUMN origination_fee_bps integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'origination_fee_override_bps'
  ) THEN
    ALTER TABLE loans ADD COLUMN origination_fee_override_bps integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'origination_fee_cents'
  ) THEN
    ALTER TABLE loans ADD COLUMN origination_fee_cents bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'projected_funding_cents'
  ) THEN
    ALTER TABLE loans ADD COLUMN projected_funding_cents bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'override_reason'
  ) THEN
    ALTER TABLE loans ADD COLUMN override_reason text DEFAULT '';
  END IF;
END $$;

-- Transactions table updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN request_id text;
  END IF;
END $$;

-- Create unique index on request_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS transactions_request_id_key 
ON transactions(request_id) 
WHERE request_id IS NOT NULL;

-- Create ChangeLog table
CREATE TABLE IF NOT EXISTS change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field text NOT NULL,
  before jsonb,
  after jsonb,
  reason text DEFAULT '',
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now()
);

-- Create index for efficient querying by entity
CREATE INDEX IF NOT EXISTS change_log_entity_idx 
ON change_log(entity_type, entity_id);

-- Create index for querying by time
CREATE INDEX IF NOT EXISTS change_log_changed_at_idx 
ON change_log(changed_at DESC);

-- Enable RLS on change_log
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

-- Policies for change_log
CREATE POLICY "Authenticated users can view change log"
  ON change_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert change log entries"
  ON change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- Update existing data: populate prime_rate_bps from prime_rate if set
UPDATE settings 
SET prime_rate_bps = ROUND(prime_rate * 100)::integer
WHERE prime_rate IS NOT NULL AND prime_rate_bps IS NULL;

-- Populate interest_rate_bps from existing data (spread + prime or fixed_apr)
UPDATE loans 
SET interest_rate_bps = 
  CASE 
    WHEN rate_type = 'fixed' THEN ROUND(fixed_apr * 100)::integer
    WHEN rate_type = 'floating' THEN ROUND((spread + (SELECT prime_rate FROM settings LIMIT 1)) * 100)::integer
    ELSE NULL
  END
WHERE interest_rate_bps IS NULL;

-- Populate principal_cents from principal
UPDATE loans 
SET principal_cents = ROUND(principal * 100)::bigint
WHERE principal IS NOT NULL AND principal_cents IS NULL;

-- Populate ltv_pct from ltv_percent if not already set
UPDATE loans 
SET ltv_pct = ltv_percent
WHERE ltv_percent IS NOT NULL AND ltv_pct IS NULL;
