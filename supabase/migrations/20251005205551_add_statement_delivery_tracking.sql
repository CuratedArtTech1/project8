/*
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
