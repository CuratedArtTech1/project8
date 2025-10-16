# Curated Capital Group - Art Loan Management System
## Complete Code Review Package

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Application Code](#core-application-code)
4. [Component Files](#component-files)
5. [Library & Utilities](#library--utilities)
6. [Database Schema](#database-schema)
7. [Configuration Files](#configuration-files)

---

## System Overview

**Purpose**: Art-backed loan origination and management system for Curated Capital Group

**Key Features**:
- Draft loan builder with LTV calculations
- Artwork collateral management
- Borrower & facility tracking
- Transaction recording
- PDF document generation
- User management with role-based access

**Tech Stack**:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- PDF Generation: jsPDF

---

## Architecture

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Main routing & auth
├── index.css                   # Tailwind imports
├── components/
│   ├── Auth.tsx               # Login/signup
│   ├── Dashboard.tsx          # Main dashboard
│   ├── BorrowerPage.tsx       # Borrower detail view
│   ├── FacilityPage.tsx       # Facility management
│   ├── DraftLoanBuilder.tsx   # Loan creation engine
│   ├── UserManagement.tsx     # User admin
│   └── UI.tsx                 # Reusable UI components
├── lib/
│   ├── supabase.ts           # Database client
│   ├── money.ts              # Currency utilities
│   ├── utils.ts              # General utilities
│   ├── statements.ts         # Statement generation
│   └── draftLoanPdf.ts       # PDF generation
└── types/
    └── index.ts              # TypeScript definitions
```

---

## Core Application Code

### 1. main.tsx
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 2. App.tsx
```typescript
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { BorrowerPage } from './components/BorrowerPage';
import { FacilityPage } from './components/FacilityPage';
import { UserManagement } from './components/UserManagement';
import DraftLoanBuilder from './components/DraftLoanBuilder';
import type { User } from '@supabase/supabase-js';

type Route =
  | { page: 'home' }
  | { page: 'borrower'; borrowerId: string }
  | { page: 'facility'; facilityId: string }
  | { page: 'users' }
  | { page: 'loan-builder' };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEnvVars = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setError('Missing Supabase environment variables.');
        setLoading(false);
        return false;
      }
      return true;
    };

    if (!checkEnvVars()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Error getting session:', err);
      setError('Failed to initialize authentication.');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRoute({ page: 'home' });
  };

  const navigateToBorrower = (borrowerId: string) => {
    setRoute({ page: 'borrower', borrowerId });
  };

  const navigateToFacility = (facilityId: string) => {
    setRoute({ page: 'facility', facilityId });
  };

  const navigateToUserManagement = () => {
    setRoute({ page: 'users' });
  };

  const navigateToLoanBuilder = () => {
    setRoute({ page: 'loan-builder' });
  };

  const navigateHome = () => {
    setRoute({ page: 'home' });
  };

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Route rendering
  if (route.page === 'borrower') {
    return (
      <BorrowerPage
        borrowerId={route.borrowerId}
        onBack={navigateHome}
        userEmail={user.email || ''}
      />
    );
  }

  if (route.page === 'facility') {
    return (
      <FacilityPage
        facilityId={route.facilityId}
        onBack={navigateHome}
        onViewBorrower={navigateToBorrower}
        onViewLoan={navigateToBorrower}
      />
    );
  }

  if (route.page === 'users') {
    return <UserManagement onBack={navigateHome} />;
  }

  if (route.page === 'loan-builder') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <button
            onClick={navigateHome}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
        <DraftLoanBuilder />
      </div>
    );
  }

  return (
    <Dashboard
      onNavigateToBorrower={navigateToBorrower}
      onNavigateToFacility={navigateToFacility}
      onNavigateToUserManagement={navigateToUserManagement}
      onNavigateToLoanBuilder={navigateToLoanBuilder}
      onSignOut={handleSignOut}
      userEmail={user.email || ''}
    />
  );
}
```

---

## Library & Utilities

### lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing'
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
```

### lib/money.ts - CRITICAL FOR CALCULATIONS
```typescript
/**
 * Converts cents (integer) to USD dollars (decimal)
 * Example: 292500000 cents → 2925000.00 USD
 */
export const toUSD = (cents: number | null | undefined): number => {
  return (cents ?? 0) / 100;
};

/**
 * Formats cents as currency string
 * Example: 292500000 → "$2,925,000.00"
 */
export const usdStr = (cents: number | null | undefined): string => {
  return toUSD(cents).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

/**
 * Converts USD dollars (string or number) to cents (integer)
 * Example: "2925000.00" → 292500000 cents
 * Example: 2925000 → 292500000 cents
 */
export const fromUSD = (value: string | number): number => {
  return Math.round(Number(value || 0) * 100);
};

/**
 * Converts basis points to percentage label
 * Example: 500 bps → "5.00%"
 */
export const pctLabel = (bps: number | null | undefined): string => {
  return `${(Number(bps || 0) / 100).toFixed(2)}%`;
};

/**
 * Converts basis points to decimal rate
 * Example: 500 bps → 0.05 (5%)
 */
export const bpsToDecimal = (bps: number | null | undefined): number => {
  return Number(bps || 0) / 10000;
};

/**
 * Converts decimal rate to basis points
 * Example: 0.05 → 500 bps
 */
export const decimalToBps = (decimal: number): number => {
  return Math.round(decimal * 10000);
};
```

---

## Key Calculation Logic - DraftLoanBuilder.tsx

### Core State Management
```typescript
const [principalUSD, setPrincipalUSD] = useState('');  // User input as string
const [borrowerId, setBorrowerId] = useState('');
const [assignedArtworks, setAssignedArtworks] = useState<Artwork[]>([]);
const [prepaidInterestMonths, setPrepaidInterestMonths] = useState(1);
const [spreadPct, setSpreadPct] = useState('5.00');
const [origFeePct, setOrigFeePct] = useState('2.00');
```

### Critical Calculations (Lines 246-273)
```typescript
// Calculate total collateral value in cents
const sumValuationsCents = useMemo(() => {
  return assignedArtworks.reduce((total, artwork) => {
    return total + fromUSD(artwork.appraised_value || 0);
  }, 0);
}, [assignedArtworks]);

// Calculate interest rate in basis points
const primeBps = Number(settings?.prime_rate_bps || 0);
const spreadBps = Math.round(Number(spreadPct || 0) * 100);
const rateBps = primeBps + spreadBps;

// LTV calculation
const baseLtv = 45;  // 45% default
const ltvPct = overrideLtv ? Number(ltvPctOverride || baseLtv) : baseLtv;

// Convert principal from string to cents
const principalCents = principalUSD ? fromUSD(principalUSD) : 0;

// Calculate maximum principal allowed based on LTV
const maxPrincipalCents = Math.floor(sumValuationsCents * (ltvPct / 100));

// Calculate current LTV percentage
const currentLtvPct = sumValuationsCents > 0
  ? (principalCents / sumValuationsCents) * 100
  : 0;

// Calculate origination fee
const origFeeBps = Math.round(Number(origFeePct || 0) * 100);
const originationFeeCents = Math.round(principalCents * (origFeeBps / 10000));

// Calculate prepaid interest
const monthlyRate = rateBps / 10000 / 12;
const prepaidInterestCents = Math.round(
  principalCents * monthlyRate * Number(prepaidInterestMonths || 0)
);

// Calculate net funding
const prepaidFeesCents = prepaidFeesUSD ? fromUSD(prepaidFeesUSD) : 0;
const totalDeductionsCents = originationFeeCents + prepaidInterestCents + prepaidFeesCents;
const netFundingCents = principalCents - totalDeductionsCents;
```

### Input Handling (Lines 1044-1069)
```typescript
<input
  type="text"
  className={`w-full rounded-xl border px-3 py-2 text-sm mt-1 ${
    principalCents > maxPrincipalCents ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`}
  value={principalUSD}
  onChange={(e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');  // Strip non-numeric
    setPrincipalUSD(val);  // Store cleaned value
  }}
  placeholder="Enter amount (e.g., 5000000 or 5000000.50)"
  required
/>
<div className="flex items-center justify-between text-xs mt-1">
  <span className={principalCents > maxPrincipalCents ? 'text-red-600 font-semibold' : 'text-gray-500'}>
    LTV: {currentLtvPct > 0 ? currentLtvPct.toFixed(2) : '0.00'}% / {ltvPct}% max
  </span>
  <span className="text-gray-600">
    Max: {usdStr(maxPrincipalCents)}
  </span>
</div>
{principalCents > maxPrincipalCents && (
  <p className="text-xs text-red-600 mt-1 font-semibold">
    Principal exceeds {ltvPct}% LTV limit
  </p>
)}
```

---

## Database Schema

### Core Tables

**borrowers**
- `id` (uuid, primary key)
- `name` (text)
- `contact` (text) - email address
- `note` (text)
- `created_at`, `updated_at` (timestamptz)

**artworks**
- `id` (uuid, primary key)
- `title` (text)
- `artist` (text)
- `dimensions` (text)
- `materials` (text)
- `appraised_value` (numeric) - stored as dollars, converted to cents in app
- `owner` (text) - references borrower id
- `location` (text)
- `appraisal_date` (date)
- `created_at`, `updated_at` (timestamptz)

**loans**
- `id` (uuid, primary key)
- `loan_name` (text)
- `borrower_id` (uuid, foreign key → borrowers)
- `facility_id` (uuid, foreign key → lender_facilities)
- `principal_cents` (bigint) - principal in cents
- `interest_rate_bps` (integer) - rate in basis points
- `ltv_pct` (numeric) - loan-to-value percentage
- `origination_fee_cents` (bigint)
- `prepaid_interest_months` (integer)
- `prepaid_fees_cents` (bigint)
- `projected_funding_cents` (bigint)
- `interest_frequency` (text) - 'monthly' or 'quarterly'
- `status` (text) - 'active', 'paid_off', 'defaulted'
- `version` (integer) - for optimistic locking
- `created_at`, `updated_at` (timestamptz)

**loan_artworks** (Junction Table)
- `id` (uuid, primary key)
- `loan_id` (uuid, foreign key → loans)
- `artwork_id` (uuid, foreign key → artworks)
- `created_at` (timestamptz)
- UNIQUE constraint on (loan_id, artwork_id)

**transactions**
- `id` (uuid, primary key)
- `loan_id` (uuid, foreign key → loans)
- `date` (date)
- `type` (text) - 'advance', 'repayment', 'interest_due', 'interest_payment', 'fee', 'fee_payment'
- `amount` (numeric) - in dollars
- `note` (text)
- `request_id` (uuid) - for idempotency
- `created_at` (timestamptz)

**lender_facilities**
- `id` (uuid, primary key)
- `name` (text)
- `lender_name` (text)
- `facility_limit` (numeric)
- `interest_rate_floor` (numeric)
- `origination_fee_pct` (numeric)
- `status` (text) - 'active', 'inactive'
- `created_at`, `updated_at` (timestamptz)

**settings** (Single Row)
- `id` (uuid, primary key)
- `prime_rate_bps` (integer) - prime rate in basis points
- `ltv_limit` (numeric) - default LTV limit percentage
- `default_origination_fee_bps` (integer)
- `auto_send_monthly_statements` (boolean)
- `statement_day_of_month` (integer)
- `currency` (text)
- `updated_at` (timestamptz)

**user_profiles**
- `id` (uuid, primary key, foreign key → auth.users)
- `email` (text)
- `role` (text) - 'admin', 'user', 'viewer'
- `active` (boolean)
- `created_at`, `updated_at` (timestamptz)

---

## Configuration Files

### package.json
```json
{
  "name": "vite-react-typescript-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.app.json"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "jspdf": "^3.0.3",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```

### .env (Required Environment Variables)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Example Calculation Flow

### Scenario: Creating a $292,500 loan against $650,000 in artwork

1. **User Input**: Types `292500` in Principal field
2. **State Update**: `principalUSD = "292500"`
3. **Conversion**: `principalCents = fromUSD("292500") = 29250000` (cents)
4. **Collateral Calculation**:
   - Artwork 1: $450,000 → 45,000,000 cents
   - Artwork 2: $200,000 → 20,000,000 cents
   - Total: 65,000,000 cents
5. **LTV Calculation**:
   - Max Principal: `65,000,000 × 0.45 = 29,250,000` cents
   - Current LTV: `(29,250,000 / 65,000,000) × 100 = 45.00%`
6. **Fee Calculations**:
   - Origination Fee (2%): `29,250,000 × 0.02 = 585,000` cents = $5,850
   - Prepaid Interest (1 month @ 8.5%): `29,250,000 × (850/10000/12) = 20,719` cents = $207.19
   - Total Deductions: $6,057.19
7. **Net Funding**: `$292,500 - $6,057.19 = $286,442.81`

---

## Security Features

1. **Row Level Security (RLS)**: All tables have RLS policies
2. **Role-Based Access**: Admin, User, Viewer roles
3. **Active User Check**: Only active users can access data
4. **Optimistic Locking**: Version field prevents concurrent updates
5. **Audit Trail**: Change logs for critical operations
6. **Request ID**: Transaction idempotency via UUID

---

## Key Business Logic

### LTV Enforcement
- Default: 45% LTV limit
- Overridable with mandatory reason
- Real-time validation in UI
- Red warning when limit exceeded

### Money Handling
- All amounts stored as cents (integers)
- Prevents floating-point errors
- Conversion functions in `lib/money.ts`

### Interest Calculation
- Supports fixed or floating rates
- Basis points (bps) for precision
- Monthly or quarterly accrual
- Prime rate + spread model

### Document Generation
- Artwork Valuation Report
- Loan Terms Sheet
- Funding Statement
- Complete Loan Package
- Lender Income Statement

---

## Deployment Notes

**Requirements**:
- Node.js 18+
- Supabase project
- Environment variables configured

**Build Command**: `npm run build`

**Production URL**: Deployed to Netlify/Vercel with redirect rules

---

## Support & Maintenance

**Key Files to Monitor**:
- `DraftLoanBuilder.tsx` - Core calculation logic
- `lib/money.ts` - Currency conversion
- Database migrations in `supabase/migrations/`

**Common Issues**:
1. LTV calculation off → Check `fromUSD()` conversion
2. Negative net funding → Verify deduction calculations
3. Auth errors → Check Supabase environment variables

---

**Document Generated**: 2025-10-12
**System Version**: 1.0.0
**Last Updated**: October 2025
