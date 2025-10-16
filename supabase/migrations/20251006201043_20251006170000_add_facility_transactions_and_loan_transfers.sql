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
