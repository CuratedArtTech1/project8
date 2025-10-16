/*
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
END $$;