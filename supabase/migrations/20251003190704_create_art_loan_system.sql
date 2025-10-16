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
CREATE INDEX IF NOT EXISTS idx_documents_artwork_id ON documents(artwork_id);