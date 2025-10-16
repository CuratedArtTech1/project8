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
