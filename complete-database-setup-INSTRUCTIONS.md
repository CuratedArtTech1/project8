# Complete Database Setup for Supabase

## Quick Setup Instructions

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/cgxmtazwfptjuqifeypn/sql/new

2. **Copy the entire contents** of `complete-database-setup.sql`

3. **Paste into the SQL Editor**

4. **Click "Run"** to execute all migrations

5. **Refresh your application** at http://localhost:5174/

## What This Does

This SQL file contains all 19 migration files in the correct chronological order:

1. Creates the complete art loan management system schema
2. Sets up all tables: borrowers, loans, artworks, transactions, documents, etc.
3. Adds lender facilities support
4. Configures facility transactions and loan transfers
5. Adds interest rate tracking and history
6. Sets up user roles and access control
7. Enables Row Level Security (RLS) on all tables
8. Creates all necessary policies for data access

## Tables Created

- borrowers
- loans
- artworks
- loan_artworks (junction table)
- transactions
- documents
- coi_records (Certificate of Insurance)
- ucc_records (Uniform Commercial Code filings)
- settings
- lender_facilities
- facility_transactions
- loan_transfers
- facility_history
- lender_payments
- interest_rate_changes
- artwork_fact_sheets
- changelog (audit trail)
- user_profiles

## Security

All tables have:
- Row Level Security enabled
- Policies restricting access to authenticated users only
- Additional restrictions for specific email addresses where needed

## Troubleshooting

If you get errors about tables already existing:
- Some tables may already be partially created
- You can either:
  1. Drop existing tables and re-run (CAUTION: loses data)
  2. Run migrations individually to skip already-created tables

If you need to reset completely:
```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run the complete-database-setup.sql file.
