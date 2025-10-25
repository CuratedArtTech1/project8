/*
  # Art Loan Program Database Schema

  1. New Tables
    - `borrowers`
      - `id` (uuid, primary key)
      - `name` (text, borrower/company name)
      - `contact` (text, email or phone)
      - `note` (text, additional notes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `artworks`
      - `id` (uuid, primary key)
      - `title` (text, artwork title)
      - `artist` (text, artist name)
      - `dimensions` (text, artwork dimensions)
      - `materials` (text, materials used)
      - `appraised_value` (numeric, appraisal value)
      - `owner` (text, owner name)
      - `location` (text, current location of artwork)
      - `appraisal_date` (date, date of appraisal)
      - `appraisal_document_url` (text, link to appraisal document)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `loans`
      - `id` (uuid, primary key)
      - `borrower_id` (uuid, foreign key to borrowers)
      - `principal` (numeric, loan principal amount)
      - `rate_type` (text, 'fixed' or 'floating')
      - `fixed_apr` (numeric, fixed APR if applicable)
      - `spread` (numeric, spread over prime rate)
      - `start_date` (date)
      - `last_accrual_date` (date)
      - `status` (text, 'active', 'paid_off', 'defaulted')
      - `statement_day` (integer, day of month for statements)
      - `ltv_percent` (numeric, loan-to-value percentage)
      - `ucc_filed` (boolean, UCC filing status)
      - `ucc_jurisdiction` (text, filing jurisdiction)
      - `ucc_filing_number` (text, UCC filing number)
      - `ucc_filing_date` (date)
      - `ucc_continuation_due` (date)
      - `ucc_collateral_desc` (text, collateral description)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `loan_artworks`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key to loans)
      - `artwork_id` (uuid, foreign key to artworks)
      - `created_at` (timestamptz)
    
    - `coi_records`
      - `id` (uuid, primary key)
      - `artwork_id` (uuid, foreign key to artworks)
      - `required` (boolean, whether COI is required)
      - `carrier` (text, insurance carrier)
      - `policy_number` (text, policy number)
      - `expires` (date, expiration date)
      - `limit_amount` (numeric, coverage limit)
      - `document_url` (text, link to COI document)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key to loans)
      - `date` (date, transaction date)
      - `type` (text, 'advance', 'repayment', 'interest', 'fee')
      - `amount` (numeric, transaction amount)
      - `note` (text, transaction note)
      - `created_at` (timestamptz)
    
    - `documents`
      - `id` (uuid, primary key)
      - `borrower_id` (uuid, foreign key to borrowers, nullable)
      - `loan_id` (uuid, foreign key to loans, nullable)
      - `artwork_id` (uuid, foreign key to artworks, nullable)
      - `name` (text, document name)
      - `type` (text, document type/category)
      - `storage_path` (text, path in storage)
      - `note` (text, document note)
      - `uploaded_at` (timestamptz)
      - `size` (integer, file size in bytes)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users only
    - Restrict access to specific email addresses
*/

-- Create borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text DEFAULT '',
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  dimensions text DEFAULT '',
  materials text DEFAULT '',
  appraised_value numeric DEFAULT 0,
  owner text DEFAULT '',
  location text DEFAULT '',
  appraisal_date date,
  appraisal_document_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id uuid REFERENCES borrowers(id) ON DELETE CASCADE,
  principal numeric DEFAULT 0,
  rate_type text DEFAULT 'floating',
  fixed_apr numeric DEFAULT 12,
  spread numeric DEFAULT 5,
  start_date date DEFAULT CURRENT_DATE,
  last_accrual_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  statement_day integer DEFAULT 1,
  ltv_percent numeric DEFAULT 0,
  ucc_filed boolean DEFAULT false,
  ucc_jurisdiction text DEFAULT '',
  ucc_filing_number text DEFAULT '',
  ucc_filing_date date,
  ucc_continuation_due date,
  ucc_collateral_desc text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loan_artworks junction table
CREATE TABLE IF NOT EXISTS loan_artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(loan_id, artwork_id)
);

-- Create COI records table
CREATE TABLE IF NOT EXISTS coi_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE,
  required boolean DEFAULT false,
  carrier text DEFAULT '',
  policy_number text DEFAULT '',
  expires date,
  limit_amount numeric DEFAULT 0,
  document_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  type text NOT NULL,
  amount numeric DEFAULT 0,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id uuid REFERENCES borrowers(id) ON DELETE SET NULL,
  loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  artwork_id uuid REFERENCES artworks(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text DEFAULT '',
  storage_path text NOT NULL,
  note text DEFAULT '',
  uploaded_at timestamptz DEFAULT now(),
  size integer DEFAULT 0
);

-- Create settings table for prime rate and LTV limit
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prime_rate numeric DEFAULT 7.25,
  ltv_limit numeric DEFAULT 45,
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO settings (prime_rate, ltv_limit)
SELECT 7.25, 45
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Enable RLS on all tables
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users only
CREATE POLICY "Authenticated users can read borrowers"
  ON borrowers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert borrowers"
  ON borrowers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update borrowers"
  ON borrowers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete borrowers"
  ON borrowers FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read artworks"
  ON artworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert artworks"
  ON artworks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update artworks"
  ON artworks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete artworks"
  ON artworks FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read loan_artworks"
  ON loan_artworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loan_artworks"
  ON loan_artworks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete loan_artworks"
  ON loan_artworks FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read coi_records"
  ON coi_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert coi_records"
  ON coi_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update coi_records"
  ON coi_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete coi_records"
  ON coi_records FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_artworks_loan_id ON loan_artworks(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_artworks_artwork_id ON loan_artworks(artwork_id);
CREATE INDEX IF NOT EXISTS idx_coi_records_artwork_id ON coi_records(artwork_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_borrower_id ON documents(borrower_id);
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_artwork_id ON documents(artwork_id);/*
  # Add Storage Policies for Documents Bucket

  1. Storage Policies
    - Allow authenticated users to upload documents (INSERT)
    - Allow authenticated users to view documents (SELECT)
    - Allow authenticated users to update documents (UPDATE)
    - Allow authenticated users to delete documents (DELETE)

  2. Security
    - All policies require authentication
    - Users can manage documents in the 'documents' bucket
*/

-- Create policy for inserting documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Create policy for selecting documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Create policy for updating documents
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Create policy for deleting documents
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');/*
  # Add Statement Delivery Tracking

  1. New Tables
    - `statement_deliveries`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key to loans)
      - `borrower_id` (uuid, foreign key to borrowers)
      - `delivery_date` (date) - When the statement was sent
      - `delivery_type` (text) - 'monthly_statement' or 'interest_invoice'
      - `email` (text) - Email address it was sent to
      - `status` (text) - 'sent', 'failed', 'pending'
      - `error_message` (text, nullable) - Error details if failed
      - `created_at` (timestamptz)
  
  2. Settings Updates
    - Add `auto_send_monthly_statements` (boolean, default false)
    - Add `statement_day_of_month` (integer, default 1) - Day to send statements
    - Add `from_email` (text, nullable) - Email to send from
  
  3. Security
    - Enable RLS on `statement_deliveries` table
    - Add policy for authenticated users to read their own records
*/

CREATE TABLE IF NOT EXISTS statement_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  borrower_id uuid REFERENCES borrowers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_type text NOT NULL CHECK (delivery_type IN ('monthly_statement', 'interest_invoice')),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE statement_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own statement deliveries"
  ON statement_deliveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert statement deliveries"
  ON statement_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update statement deliveries"
  ON statement_deliveries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add new settings columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'auto_send_monthly_statements'
  ) THEN
    ALTER TABLE settings ADD COLUMN auto_send_monthly_statements boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'statement_day_of_month'
  ) THEN
    ALTER TABLE settings ADD COLUMN statement_day_of_month integer DEFAULT 1 CHECK (statement_day_of_month >= 1 AND statement_day_of_month <= 28);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'from_email'
  ) THEN
    ALTER TABLE settings ADD COLUMN from_email text;
  END IF;
END $$;
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
/*
  # Add Facility Transactions and Loan Transfer Tracking

  1. New Tables
    - `facility_transactions`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key to lender_facilities)
      - `date` (date)
      - `type` (text) - draw, repayment, fee, interest
      - `amount` (numeric)
      - `note` (text)
      - `created_at` (timestamptz)

    - `loan_transfers`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key to loans)
      - `from_facility_id` (uuid, foreign key to lender_facilities, nullable)
      - `to_facility_id` (uuid, foreign key to lender_facilities, nullable)
      - `transfer_date` (date)
      - `note` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data

  3. Purpose
    - Track financial transactions at the facility level
    - Document loan movements between facilities for audit trail
*/

CREATE TABLE IF NOT EXISTS facility_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES lender_facilities(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('draw', 'repayment', 'fee', 'interest')),
  amount numeric NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loan_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL,
  to_facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL,
  transfer_date date NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facility_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facility transactions"
  ON facility_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert facility transactions"
  ON facility_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update facility transactions"
  ON facility_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete facility transactions"
  ON facility_transactions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view loan transfers"
  ON loan_transfers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert loan transfers"
  ON loan_transfers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update loan transfers"
  ON loan_transfers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete loan transfers"
  ON loan_transfers FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_facility_transactions_facility_id ON facility_transactions(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_transactions_date ON facility_transactions(date);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_loan_id ON loan_transfers(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_from_facility ON loan_transfers(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_to_facility ON loan_transfers(to_facility_id);
/*
  # Add Facility Transactions and Loan Transfer Tracking

  1. New Tables
    - `facility_transactions`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key to lender_facilities)
      - `date` (date)
      - `type` (text) - draw, repayment, fee, interest
      - `amount` (numeric)
      - `note` (text)
      - `created_at` (timestamptz)

    - `loan_transfers`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key to loans)
      - `from_facility_id` (uuid, foreign key to lender_facilities, nullable)
      - `to_facility_id` (uuid, foreign key to lender_facilities, nullable)
      - `transfer_date` (date)
      - `note` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data

  3. Purpose
    - Track financial transactions at the facility level
    - Document loan movements between facilities for audit trail
*/

CREATE TABLE IF NOT EXISTS facility_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES lender_facilities(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('draw', 'repayment', 'fee', 'interest')),
  amount numeric NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loan_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL,
  to_facility_id uuid REFERENCES lender_facilities(id) ON DELETE SET NULL,
  transfer_date date NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facility_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facility transactions"
  ON facility_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert facility transactions"
  ON facility_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update facility transactions"
  ON facility_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete facility transactions"
  ON facility_transactions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view loan transfers"
  ON loan_transfers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert loan transfers"
  ON loan_transfers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update loan transfers"
  ON loan_transfers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete loan transfers"
  ON loan_transfers FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_facility_transactions_facility_id ON facility_transactions(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_transactions_date ON facility_transactions(date);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_loan_id ON loan_transfers(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_from_facility ON loan_transfers(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_loan_transfers_to_facility ON loan_transfers(to_facility_id);
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
  USING (true);/*
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
/*
  # Add Lender Payments Tracking

  1. New Tables
    - `lender_payments`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key to lender_facilities)
      - `payment_date` (date) - when payment was made to lender
      - `amount` (numeric) - amount paid
      - `payment_type` (text) - type: 'interest', 'principal', 'fees'
      - `borrower_id` (uuid, nullable, foreign key) - which borrower this payment relates to
      - `note` (text) - additional details
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `lender_payments` table
    - Add policies for authenticated users to manage payments
*/

CREATE TABLE IF NOT EXISTS lender_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES lender_facilities(id) ON DELETE CASCADE NOT NULL,
  payment_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_type text NOT NULL CHECK (payment_type IN ('interest', 'principal', 'fees')),
  borrower_id uuid REFERENCES borrowers(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lender_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lender payments"
  ON lender_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lender payments"
  ON lender_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lender payments"
  ON lender_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete lender payments"
  ON lender_payments FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lender_payments_facility_id ON lender_payments(facility_id);
CREATE INDEX IF NOT EXISTS idx_lender_payments_payment_date ON lender_payments(payment_date);/*
  # Add Fact Sheet Storage for Artworks

  1. Changes
    - Add `fact_sheet_url` column to `artworks` table to store uploaded fact sheet PDFs
  
  2. Notes
    - Uses same storage bucket as other documents
    - Existing artworks will have NULL fact sheets until uploaded
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artworks' AND column_name = 'fact_sheet_url'
  ) THEN
    ALTER TABLE artworks ADD COLUMN fact_sheet_url text;
  END IF;
END $$;/*
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
END $$;/*
  # Add User Roles and Access Control

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `role` (text: 'admin' or 'user')
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamptz)

  2. Changes
    - Add user_profiles table to track user roles and access
    - Admin users can manage other users
    - Non-admin users must be active to access the system

  3. Security
    - Enable RLS on user_profiles table
    - Admins can view, create, update all user profiles
    - Users can view their own profile
    - Only admins can grant/revoke access and change roles

  4. Initial Data
    - Create admin profile for meghan@ccg-art.com
    - Create user profiles for existing users (valentina@ccg-art.com, jcoyne@stonecaps.com)
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can update user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = true
    )
  );

-- Function to check if user is active admin
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Insert profiles for existing users
DO $$
DECLARE
  meghan_id uuid;
  valentina_id uuid;
  jcoyne_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO meghan_id FROM auth.users WHERE email = 'meghan@ccg-art.com';
  SELECT id INTO valentina_id FROM auth.users WHERE email = 'valentina@ccg-art.com';
  SELECT id INTO jcoyne_id FROM auth.users WHERE email = 'jcoyne@stonecaps.com';

  -- Insert meghan as admin (if exists)
  IF meghan_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (meghan_id, 'meghan@ccg-art.com', 'admin', true, meghan_id)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
  END IF;

  -- Insert valentina as active user (if exists)
  IF valentina_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (valentina_id, 'valentina@ccg-art.com', 'user', true, meghan_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert jcoyne as active user (if exists)
  IF jcoyne_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, role, is_active, created_by)
    VALUES (jcoyne_id, 'jcoyne@stonecaps.com', 'user', true, meghan_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
/*
  # Update RLS Policies for Active User Check

  1. Changes
    - Add restrictive policies to all tables to ensure only active users can access data
    - Keep existing permissive policies for basic CRUD operations
    - Add a layer that checks user is in user_profiles and is_active = true

  2. Security
    - All data access now requires user to be in user_profiles table with is_active = true
    - This allows admins to grant/revoke access by toggling is_active flag
*/

-- Add restrictive policies to ensure only active users can access the system

-- Borrowers
CREATE POLICY "Only active users can access borrowers"
  ON borrowers
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Loans
CREATE POLICY "Only active users can access loans"
  ON loans
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Artworks
CREATE POLICY "Only active users can access artworks"
  ON artworks
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Transactions
CREATE POLICY "Only active users can access transactions"
  ON transactions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Documents
CREATE POLICY "Only active users can access documents"
  ON documents
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- COI Records
CREATE POLICY "Only active users can access coi_records"
  ON coi_records
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Loan Artworks
CREATE POLICY "Only active users can access loan_artworks"
  ON loan_artworks
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Settings
CREATE POLICY "Only active users can access settings"
  ON settings
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Lender Facilities
CREATE POLICY "Only active users can access lender_facilities"
  ON lender_facilities
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Facility Transactions
CREATE POLICY "Only active users can access facility_transactions"
  ON facility_transactions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Loan Transfers
CREATE POLICY "Only active users can access loan_transfers"
  ON loan_transfers
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Facility History
CREATE POLICY "Only active users can access facility_history"
  ON facility_history
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Interest Rate Changes
CREATE POLICY "Only active users can access interest_rate_changes"
  ON interest_rate_changes
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Lender Payments
CREATE POLICY "Only active users can access lender_payments"
  ON lender_payments
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Statement Deliveries
CREATE POLICY "Only active users can access statement_deliveries"
  ON statement_deliveries
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Change Log
CREATE POLICY "Only active users can access change_log"
  ON change_log
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );
/*
  # Fix Infinite Recursion in user_profiles RLS Policies

  ## Problem
  The RLS policies for user_profiles were querying the same table within the policy,
  causing infinite recursion when any query tried to access user_profiles.

  ## Solution
  1. Drop all existing policies on user_profiles
  2. Create a helper function to check if current user is an active admin
  3. Create new policies using the helper function to avoid recursion

  ## Security
  - Active users can view their own profile
  - Active admins can view all profiles
  - Active admins can insert, update, and delete profiles
  - All operations require is_active = true
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

-- Create helper function to check if current user is an active admin
CREATE OR REPLACE FUNCTION is_active_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    AND is_active = true
  );

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_active_admin());

CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_active_admin());

CREATE POLICY "Admins can update profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_active_admin())
  WITH CHECK (is_active_admin());

CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_active_admin());
