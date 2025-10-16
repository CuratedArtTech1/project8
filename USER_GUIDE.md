# CCG Art Loan Tracker - User Guide

## Getting Started

### Signing In
1. Navigate to the application URL
2. Enter your email address (must be one of the three authorized emails)
3. Enter your password
4. Click "Sign In"

## Dashboard Overview

The main dashboard shows:
- All borrowers
- All artwork in the system
- Overview of all loans with key metrics

### Settings
At the top of the dashboard, you can adjust:
- **Prime Rate**: Current prime rate percentage
- **LTV Limit**: Maximum loan-to-value percentage (default: 45%)

## Managing Borrowers

### Adding a Borrower
1. Fill in the "Add Borrower" form at the top of the dashboard:
   - **Name**: Full name or company name
   - **Contact**: Email or phone number
   - **Note**: Any additional information
2. Click "Add Borrower"

### Viewing a Borrower
1. Find the borrower in the "Borrowers" table
2. Click "Open" to view their dedicated page

### Borrower Page Features
Each borrower has their own page showing:
- All loans associated with the borrower
- Collateral artworks
- Transaction history
- Uploaded documents

## Managing Artworks

### Adding an Artwork
1. Fill in the "Add Artwork" form:
   - **Title**: Artwork title (required)
   - **Artist**: Artist name (required)
   - **Dimensions**: Physical dimensions (e.g., "24 x 36 in")
   - **Materials**: Medium used (e.g., "Oil on canvas")
   - **Appraised Value**: Current appraised value in USD
   - **Owner**: Current owner name
   - **Location**: Physical location of the artwork
   - **Appraisal Date**: Date of most recent appraisal

2. **Certificate of Insurance (COI)**:
   - Check "COI Required" if insurance is needed
   - If required, fill in:
     - **Carrier**: Insurance company name
     - **Policy Number**: Policy identification number
     - **Expires**: Expiration date of the policy
     - **Coverage Limit**: Insurance coverage amount

3. Click "Add Artwork"

### COI Status Indicators
- **Green "Valid"**: COI is current and valid for more than 30 days
- **Blue "Due Xd"**: COI expires in X days (30 days or less)
- **Red "Expired"**: COI has expired
- **Red "Missing"**: COI is required but not on file
- **Blue "Not required"**: No COI needed for this artwork

## Creating Loans

### Loan Setup
1. Fill in the "Create Loan" form:
   - **Borrower**: Select from existing borrowers
   - **Principal Amount**: Loan amount in USD
   - **Rate Type**:
     - Floating: Prime + Spread
     - Fixed: Locked APR
   - **Fixed APR** or **Spread**: Depending on rate type
   - **Start Date**: Loan origination date
   - **Statement Day**: Day of month for statements (1-28)

2. **Select Collateral**:
   - Check one or more artworks from the list
   - The system will calculate LTV automatically

3. **UCC Filing** (if applicable):
   - Check "UCC Filed" if a UCC filing exists
   - Fill in:
     - **Jurisdiction**: State/jurisdiction of filing
     - **Filing Number**: UCC filing number
     - **Filing Date**: Date of UCC filing
     - **Continuation Due**: Date when continuation is required
     - **Collateral Description**: Description of pledged collateral

4. Click "Create Loan"

### Understanding Loan Metrics
- **Balance**: Current outstanding principal
- **APR**: Annual percentage rate (shown in red if fixed, blue if floating)
- **LTV**: Loan-to-value ratio
  - Green "OK" badge: Within limit
  - Red "Over" badge: Exceeds LTV limit
- **UCC Status**:
  - Green "Filed": UCC filed and continuation not due soon
  - Blue "Continuation due Xd": Continuation needed in X days
  - Red "Not filed": No UCC filing on record
  - Red "Lapsed": UCC has lapsed

## Managing Transactions

From a borrower's page, you can add transactions:

### Transaction Types
- **Advance**: New funds advanced to borrower
- **Repayment**: Principal repayment
- **Interest**: Interest payment or posting
- **Fee**: Fees charged to the loan

### Adding a Transaction
1. Select the loan
2. Enter the date
3. Choose transaction type
4. Enter amount
5. Add optional note
6. Click "Add Transaction"

## Document Management

### Uploading Documents
From a borrower's page:
1. Click "Choose File" and select a document
2. Optionally link to a specific loan or artwork
3. Add a note describing the document
4. Click "Upload"

### Downloading Documents
1. Find the document in the "Documents" table
2. Click "Download"

### Document Types
The system supports all file types including:
- PDFs (appraisals, contracts, UCCs, COIs)
- Images (photos of artwork)
- Word documents
- Spreadsheets

## Generating Loan Statements

### PDF Statement
From a borrower's page:
1. Find the loan in the "Loans" table
2. Click "PDF Statement"
3. The statement will download automatically

### Statement Contents
Each statement includes:
- Borrower information
- Loan ID and statement date
- Current rate and terms
- Principal balance
- Current LTV
- UCC filing details
- Complete transaction history
- Accrued (unposted) interest

## Key Features

### Automatic Calculations
The system automatically calculates:
- Loan balances based on advances and repayments
- Current APR (for floating rate loans)
- LTV percentages based on appraised values
- Accrued interest

### Status Tracking
The system tracks:
- COI expiration dates with alerts
- UCC filing dates and continuation requirements
- LTV compliance with customizable limits
- Loan status (active, paid off, defaulted)

## Best Practices

### Borrower Management
- Keep contact information up to date
- Use the notes field for important context

### Artwork Management
- Update locations when artworks move
- Upload appraisal documents when you add artworks
- Set COI expiration reminders in your calendar

### Loan Management
- Record transactions promptly
- Generate statements monthly
- Monitor LTV ratios regularly
- Keep UCC filings current

### Document Management
- Upload all key documents (appraisals, insurance, UCC filings)
- Use descriptive notes for easy searching
- Link documents to specific loans or artworks when relevant

## Terms

- **LTV (Loan-to-Value)**: Ratio of loan balance to appraised value of collateral
- **Prime Rate**: Base interest rate (adjustable in settings)
- **Spread**: Additional percentage points added to prime rate
- **UCC**: Uniform Commercial Code filing for secured interest
- **COI**: Certificate of Insurance
- **APR**: Annual Percentage Rate

## Support

For assistance or questions about the system, contact your administrator.
