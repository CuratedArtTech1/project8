# CCG Art Loan Tracker - Setup Instructions

## Initial User Setup

This application is restricted to exactly three email addresses:
- jcoyne@stonecaps.com
- valentina@ccg-art.com
- meghan@ccg-art.com

### Creating User Accounts

Users need to be created in Supabase Auth before they can access the system. Here's how:

#### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Add each of the three allowed emails:
   - Email: jcoyne@stonecaps.com
   - Email: valentina@ccg-art.com
   - Email: meghan@ccg-art.com
5. Set a temporary password for each user (they can change it after first login)
6. Confirm the email if needed

#### Option 2: Using SQL
Run this SQL in your Supabase SQL Editor:

```sql
-- Note: You'll need to replace 'temporary_password_here' with actual passwords
-- The auth.users table is managed by Supabase, so use the dashboard method instead
```

### First Login

1. Each user should navigate to the application URL
2. Enter their email address
3. Enter the password provided by the administrator
4. They will be signed in and can access the system

## Storage Setup

The documents storage bucket has been created. If you encounter any storage issues:

1. Go to Supabase Dashboard > Storage
2. Verify that a bucket named "documents" exists
3. If policies need to be added, go to Storage > Policies and add:
   - Allow authenticated users to INSERT
   - Allow authenticated users to SELECT
   - Allow authenticated users to DELETE

## Features

### Loan Terms
- LTV: 45% (configurable in dashboard)
- Rate: Prime + 5% (configurable)

### Tracked Information

#### Borrowers
- Name, contact information, notes
- Individual borrower pages with all associated loans and documents

#### Artworks
- Title, artist, dimensions, materials
- Appraised value and appraisal date
- Current location
- COI (Certificate of Insurance) tracking

#### Loans
- Principal amount and rate (fixed or floating)
- UCC filing information
- Linked to borrower and collateral artworks
- Automatic LTV calculation
- Transaction history

#### Documents
- Upload and store documents per borrower, loan, or artwork
- Download documents as needed
- Track document types and notes

### Statement Generation
- Generate PDF loan statements
- Includes all transactions, rates, and collateral information
- Shows accrued interest calculations
- UCC filing details

## Support

For technical issues, contact your system administrator.
