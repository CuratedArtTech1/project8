export interface Borrower {
  id: string;
  name: string;
  contact: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  dimensions: string;
  materials: string;
  appraised_value: number;
  owner: string;
  location: string;
  appraisal_date: string | null;
  appraisal_document_url: string;
  fact_sheet_url: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  loan_name: string;
  borrower_id: string;
  facility_id: string | null;
  principal: number;
  rate_type: 'fixed' | 'floating';
  fixed_apr: number;
  spread: number;
  start_date: string;
  last_accrual_date: string;
  status: 'active' | 'paid_off' | 'defaulted';
  statement_day: number;
  ltv_percent: number;
  ucc_filed: boolean;
  ucc_jurisdiction: string;
  ucc_filing_number: string;
  ucc_filing_date: string | null;
  ucc_continuation_due: string | null;
  ucc_collateral_desc: string;
  created_at: string;
  updated_at: string;
  version: number;
  interest_rate_bps: number | null;
  interest_rate_override_bps: number | null;
  ltv_pct: number;
  ltv_override_pct: number | null;
  principal_cents: number | null;
  principal_override_cents: number | null;
  prepaid_interest_months: number;
  prepaid_fees_cents: number;
  origination_fee_bps: number | null;
  origination_fee_override_bps: number | null;
  origination_fee_cents: number | null;
  projected_funding_cents: number | null;
  override_reason: string;
  interest_frequency: 'monthly' | 'quarterly';
}

export interface LoanArtwork {
  id: string;
  loan_id: string;
  artwork_id: string;
  created_at: string;
}

export interface COIRecord {
  id: string;
  artwork_id: string;
  required: boolean;
  carrier: string;
  policy_number: string;
  expires: string | null;
  limit_amount: number;
  document_url: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  loan_id: string;
  date: string;
  type: 'advance' | 'repayment' | 'interest' | 'interest_due' | 'fee' | 'interest_payment' | 'fee_payment';
  amount: number;
  note: string;
  created_at: string;
  request_id: string | null;
}

export interface Document {
  id: string;
  borrower_id: string | null;
  loan_id: string | null;
  artwork_id: string | null;
  name: string;
  type: string;
  storage_path: string;
  note: string;
  uploaded_at: string;
  size: number;
}

export interface Settings {
  id: string;
  prime_rate: number;
  ltv_limit: number;
  auto_send_monthly_statements: boolean;
  statement_day_of_month: number;
  from_email: string;
  updated_at: string;
  prime_rate_bps: number;
  default_origination_fee_bps: number;
  currency: string;
}

export interface StatementDelivery {
  id: string;
  loan_id: string;
  borrower_id: string;
  delivery_date: string;
  delivery_type: 'monthly_statement' | 'interest_invoice';
  email: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  created_at: string;
}

export interface LenderFacility {
  id: string;
  name: string;
  lender_name: string;
  facility_limit: number;
  interest_rate_floor: number;
  origination_fee_pct: number;
  note: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface FacilityTransaction {
  id: string;
  facility_id: string;
  date: string;
  type: 'draw' | 'repayment' | 'fee' | 'interest' | 'paydown';
  amount: number;
  note: string;
  loan_transaction_id: string | null;
  created_at: string;
}

export interface LoanTransfer {
  id: string;
  loan_id: string;
  from_facility_id: string | null;
  to_facility_id: string | null;
  transfer_date: string;
  note: string;
  created_at: string;
}

export interface FacilityHistory {
  id: string;
  facility_id: string;
  change_date: string;
  change_type: 'limit_increase' | 'limit_decrease' | 'paydown' | 'created';
  previous_limit: number | null;
  new_limit: number | null;
  amount: number | null;
  note: string;
  created_at: string;
}

export interface InterestRateChange {
  id: string;
  loan_id: string;
  effective_date: string;
  rate_type: 'fixed' | 'floating';
  fixed_apr: number;
  spread: number;
  note: string;
  created_at: string;
  created_by: string | null;
}

export interface LenderPayment {
  id: string;
  facility_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'interest' | 'principal' | 'fees';
  borrower_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  field: string;
  before: unknown;
  after: unknown;
  reason: string;
  changed_by: string | null;
  changed_at: string;
}
