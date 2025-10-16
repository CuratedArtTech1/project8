# CCG Art Loan System - AI Coding Instructions

## Architecture Overview

This is a **full-stack art loan management system** with React/TypeScript frontend, Supabase backend, and comprehensive financial domain modeling. The system manages borrowers, artwork collateral, loans, and financial transactions with extensive compliance tracking (UCC filings, COI insurance).

### Key Architecture Patterns
- **Client-side routing**: Simple state-based routing in `App.tsx` with route objects (`{ page: 'borrower', borrowerId: string }`)
- **Monetary precision**: All financial values stored in **cents** (bigint) and **basis points** (integer) for precision - use `lib/money.ts` utilities
- **Optimistic locking**: Loans have `version` field for concurrent update protection
- **Audit trail**: `changelog` table tracks all entity modifications with before/after values
- **RLS security**: All tables use Supabase Row Level Security restricted to 3 authorized email addresses

## Core Data Model

The system revolves around **4 main entities** with complex relationships:

1. **Borrowers** → have multiple **Loans** → secured by multiple **Artworks** via `loan_artworks` junction
2. **Lender Facilities** → provide funding for loans with draw/repayment tracking
3. **Transactions** → record all financial movements (advances, repayments, interest, fees)
4. **Documents** → can link to borrowers, loans, or artworks with Supabase Storage

### Critical Financial Logic
- **LTV calculations**: `(loan_balance / total_artwork_value) * 100` - see `Dashboard.tsx` patterns
- **Interest accrual**: Floating rates = `prime_rate_bps + spread_bps`, stored separately from posted interest
- **COI tracking**: Certificate of Insurance with expiration alerts (30-day warnings)
- **UCC compliance**: Uniform Commercial Code filings with continuation due dates

## Development Workflow

### Local Development
```bash
npm run dev          # Start Vite dev server
npm run typecheck    # TypeScript checking without build
npm run lint         # ESLint validation
```

### Database Schema Evolution
- **Migrations**: All in `supabase/migrations/` - NEVER modify existing migrations
- **Types**: Auto-generated in `src/types/index.ts` - comprehensive interfaces for all entities
- **Functions**: Supabase Edge Functions in `supabase/functions/` for server-side operations (email, document processing)

## Key Components & Patterns

### Page Navigation Pattern
```typescript
// In App.tsx - centralized routing state
type Route = { page: 'home' } | { page: 'borrower'; borrowerId: string } | { page: 'facility'; facilityId: string };
// Navigate via: setRoute({ page: 'borrower', borrowerId: 'uuid' })
```

### Data Fetching Pattern
All components follow **parallel loading** pattern:
```typescript
const [entity, setEntity] = useState<EntityType[]>([]);
const loadData = async () => {
  const [res1, res2] = await Promise.all([
    supabase.from('table1').select('*'),
    supabase.from('table2').select('*')
  ]);
  // Handle results...
};
```

### Financial Calculations
````instructions
# CCG Art Loan System - AI Coding Instructions (concise)

This file contains the essential, repo-specific guidance an AI coding agent needs to be productive.

• Architecture: React + TypeScript frontend (Vite) talking to Supabase (DB, Storage, Edge Functions). Key dirs: `src/`, `lib/`, `supabase/functions/`, `supabase/migrations/`.

• Monetary model: All money stored in cents (bigint) and rates in basis points (ints). Use `lib/money.ts` helpers (`fromUSD`, `toUSD`, `usdStr`, `decimalToBps`).

• Routing & state: Single-page app with simple state-based routing in `src/App.tsx`. No global state libs — React state + lifting and Supabase realtime are used.

• Concurrency & audit: Loans use optimistic locking (`version` field). All entity edits must be compatible with `changelog` audit patterns and `supabase/migrations/` (do not modify past migrations).

• Common patterns to copy from code:
  - Parallel data loading: components call multiple `supabase.from(...).select('*')` calls with `Promise.all` (see `src/components/Dashboard.tsx`).
  - File uploads: use `supabase.storage.from('documents').upload(
    `${entityType}/${entityId}/${filename}`, file)` (see `lib/supabase.ts` helpers).
  - PDF generation: `lib/draftLoanPdf.ts` + `jspdf` for statements.

• Dev commands (from `package.json`):
  - `npm run dev` — start Vite dev server
  - `npm run build` — production build
  - `npm run preview` — preview build
  - `npm run typecheck` — runs `tsc --noEmit -p tsconfig.app.json`
  - `npm run lint` — run ESLint

• Database & types:
  - Schema migrations live in `supabase/migrations/`. Never edit applied migrations.
  - Type definitions are generated in `src/types/index.ts`; prefer them when changing interfaces.

• Integration points & side effects:
  - Supabase Edge Functions located under `supabase/functions/` (email sending, OCR, user provisioning).
  - External services: Resend API (email), Supabase Storage (documents), jsPDF (client-side PDFs).

• Project conventions (practical rules an agent must follow):
  - Monetary precision: Always use `lib/money.ts` utilities; never use floats for currency.
  - Migrations: Add new migration files for DB changes; do not change existing files under `supabase/migrations/`.
  - Auth/RLS: Data access is controlled with Row-Level Security — be conservative with queries and respect user email restrictions.
  - UI edits: Follow existing inline-edit / optimistic-update patterns; components favor small focused functions.

• Where to look first (quick triage): `src/App.tsx`, `src/components/Dashboard.tsx`, `lib/money.ts`, `lib/supabase.ts`, `lib/draftLoanPdf.ts`, `supabase/functions/`.

If anything is unclear or you need more examples from the codebase (API shapes, specific Supabase rules, or migration policies), tell me which area to expand and I will update this file.
````