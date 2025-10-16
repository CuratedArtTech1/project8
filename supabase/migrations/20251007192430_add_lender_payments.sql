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
CREATE INDEX IF NOT EXISTS idx_lender_payments_payment_date ON lender_payments(payment_date);