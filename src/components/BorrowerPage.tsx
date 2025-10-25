import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Section, Button, Badge } from './UI';
import { currency, todayISO, daysBetween, inDays } from '../lib/utils';
import { sendStatementEmail } from '../lib/statements';
// import { TransactionForm } from './forms/TransactionForm';
// import { DocumentUpload } from './forms/DocumentUpload';
// import { ArtworkForm } from './forms/ArtworkForm';
// import { LoanForm } from './forms/LoanForm';
// import { LoanTransferForm } from './forms/LoanTransferForm';
// import { UCCUpload } from './forms/UCCUpload';
// import { COIUpload } from './forms/COIUpload';
// import { InterestRateChangeForm } from './forms/InterestRateChangeForm';
import { jsPDF } from 'jspdf';
import { generateLenderIncomeStatementPDF } from '../lib/draftLoanPdf';
import type {
  Borrower,
  Artwork,
  Loan,
  Transaction,
  Document,
  COIRecord,
  LoanArtwork,
  Settings,
  LenderFacility,
  InterestRateChange,
} from '../types';

interface BorrowerPageProps {
  borrowerId: string;
  onBack: () => void;
  userEmail: string;
}

export const BorrowerPage: React.FC<BorrowerPageProps> = ({ borrowerId, onBack, userEmail }) => {
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [coiRecords, setCOIRecords] = useState<COIRecord[]>([]);
  const [loanArtworks, setLoanArtworks] = useState<LoanArtwork[]>([]);
  const [facilities, setFacilities] = useState<LenderFacility[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rateChanges, setRateChanges] = useState<InterestRateChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRateLoanId, setChangingRateLoanId] = useState<string | null>(null);
  const [changingFrequencyLoanId, setChangingFrequencyLoanId] = useState<string | null>(null);
  const [newRateType, setNewRateType] = useState<'fixed' | 'floating'>('floating');
  const [newSpread, setNewSpread] = useState('');
  const [newFixedApr, setNewFixedApr] = useState('');
  const [rateChangeEffectiveDate, setRateChangeEffectiveDate] = useState(todayISO());
  const [rateChangeReason, setRateChangeReason] = useState('');

  const [quickActionType, setQuickActionType] = useState<'coi' | 'ucc' | 'transaction' | null>(null);

  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedArtworkId, setSelectedArtworkId] = useState('');

  const [coiCarrier, setCoiCarrier] = useState('');
  const [coiPolicyNumber, setCoiPolicyNumber] = useState('');
  const [coiExpires, setCoiExpires] = useState('');
  const [coiLimitAmount, setCoiLimitAmount] = useState('');

  const [uccJurisdiction, setUccJurisdiction] = useState('');
  const [uccFilingNumber, setUccFilingNumber] = useState('');
  const [uccFilingDate, setUccFilingDate] = useState('');
  const [uccContinuationDue, setUccContinuationDue] = useState('');
  const [uccCollateralDesc, setUccCollateralDesc] = useState('');

  const [txType, setTxType] = useState<'advance' | 'repayment' | 'interest_payment' | 'fee_payment' | 'fee' | 'interest_due'>('advance');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayISO());
  const [txNote, setTxNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [borrowerRes, loansRes, artworksRes, transactionsRes, documentsRes, coiRes, loanArtworksRes, facilitiesRes, settingsRes, rateChangesRes] = await Promise.all([
        supabase.from('borrowers').select('*').eq('id', borrowerId).single(),
        supabase.from('loans').select('*').eq('borrower_id', borrowerId),
        supabase.from('artworks').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('documents').select('*').or(`borrower_id.eq.${borrowerId}`),
        supabase.from('coi_records').select('*'),
        supabase.from('loan_artworks').select('*'),
        supabase.from('lender_facilities').select('*'),
        supabase.from('settings').select('*').limit(1).single(),
        supabase.from('interest_rate_changes').select('*').order('effective_date', { ascending: false }),
      ]);

      if (borrowerRes.data) setBorrower(borrowerRes.data);
      if (loansRes.data) setLoans(loansRes.data);
      if (artworksRes.data) setArtworks(artworksRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (documentsRes.data) setDocuments(documentsRes.data);
      if (coiRes.data) setCOIRecords(coiRes.data);
      if (loanArtworksRes.data) setLoanArtworks(loanArtworksRes.data);
      if (facilitiesRes.data) setFacilities(facilitiesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (rateChangesRes.data) setRateChanges(rateChangesRes.data);
    } catch (error) {
      console.error('Error loading borrower data:', error);
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);

  useEffect(() => {
    loadData();
  }, [borrowerId, loadData]);

  const loanBalance = (loanId: string): number => {
    const advances = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'advance')
      .reduce((s, t) => s + Number(t.amount), 0);
    const repayments = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'repayment')
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, advances - repayments);
  };

  const interestDue = (loanId: string): number => {
    const due = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'interest_due')
      .reduce((s, t) => s + Number(t.amount), 0);
    const paid = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'interest_payment')
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, due - paid);
  };

  const feesDue = (loanId: string): number => {
    const due = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'fee')
      .reduce((s, t) => s + Number(t.amount), 0);
    const paid = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'fee_payment')
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, due - paid);
  };

  const currentAPR = (loan: Loan): number => {
    if (loan.rate_type === 'fixed') return Number(loan.fixed_apr);
    return Number(settings?.prime_rate || 0) + Number(loan.spread);
  };

  const getLoanArtworks = (loanId: string): Artwork[] => {
    const artworkIds = loanArtworks.filter((la) => la.loan_id === loanId).map((la) => la.artwork_id);
    return artworks.filter((a) => artworkIds.includes(a.id));
  };

  const totalAppraised = (loan: Loan): number => {
    return getLoanArtworks(loan.id).reduce((s, a) => s + Number(a.appraised_value || 0), 0);
  };

  const ltvPct = (loan: Loan): number => {
    const bal = loanBalance(loan.id);
    const tv = totalAppraised(loan);
    return tv > 0 ? (bal / tv) * 100 : 0;
  };

  const getAPRForDate = (loan: Loan, date: string): number => {
    const relevantChanges = rateChanges
      .filter((rc) => rc.loan_id === loan.id && rc.effective_date <= date)
      .sort((a, b) => b.effective_date.localeCompare(a.effective_date));

    if (relevantChanges.length > 0) {
      const change = relevantChanges[0];
      if (change.rate_type === 'fixed') return Number(change.fixed_apr);
      return Number(settings?.prime_rate || 0) + Number(change.spread);
    }

    if (loan.rate_type === 'fixed') return Number(loan.fixed_apr);
    return Number(settings?.prime_rate || 0) + Number(loan.spread);
  };

  const getBalanceAtDate = (loanId: string, asOfDate: string): number => {
    const advances = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'advance' && t.date <= asOfDate)
      .reduce((s, t) => s + Number(t.amount), 0);
    const repayments = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'repayment' && t.date <= asOfDate)
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, advances - repayments);
  };

  const accruedInterestSince = (loan: Loan, sinceDate: string, toDate: string): number => {
    const loanTxs = transactions
      .filter((t) => t.loan_id === loan.id && (t.type === 'advance' || t.type === 'repayment'))
      .filter((t) => t.date > sinceDate && t.date <= toDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    const rateChangeEvents = rateChanges
      .filter((rc) => rc.loan_id === loan.id)
      .filter((rc) => rc.effective_date > sinceDate && rc.effective_date <= toDate)
      .sort((a, b) => a.effective_date.localeCompare(b.effective_date));

    const events = [
      ...loanTxs.map(t => ({ date: t.date, type: 'balance_change' as const })),
      ...rateChangeEvents.map(rc => ({ date: rc.effective_date, type: 'rate_change' as const }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    if (events.length === 0) {
      const balance = getBalanceAtDate(loan.id, sinceDate);
      if (balance <= 0) return 0;
      const days = daysBetween(sinceDate, toDate);
      const apr = getAPRForDate(loan, sinceDate);
      return balance * (apr / 100) * (days / 365);
    }

    let totalInterest = 0;
    let periodStart = sinceDate;

    for (const event of events) {
      const balance = getBalanceAtDate(loan.id, periodStart);
      if (balance > 0) {
        const days = daysBetween(periodStart, event.date);
        const apr = getAPRForDate(loan, periodStart);
        totalInterest += balance * (apr / 100) * (days / 365);
      }
      periodStart = event.date;
    }

    const balance = getBalanceAtDate(loan.id, periodStart);
    if (balance > 0) {
      const days = daysBetween(periodStart, toDate);
      const apr = getAPRForDate(loan, periodStart);
      totalInterest += balance * (apr / 100) * (days / 365);
    }

    return totalInterest;
  };

  const previewAccrued = (loan: Loan): number => {
    let fromDate = loan.last_accrual_date;

    if (!fromDate) {
      const firstAdvance = transactions
        .filter((t) => t.loan_id === loan.id && t.type === 'advance')
        .sort((a, b) => a.date.localeCompare(b.date))[0];

      fromDate = firstAdvance ? firstAdvance.date : loan.start_date;
    }

    return accruedInterestSince(loan, fromDate, todayISO());
  };

  const getNextInterestDueDate = (loan: Loan): string => {
    const lastAccrual = loan.last_accrual_date;
    if (!lastAccrual) return 'Now';

    const lastDate = new Date(lastAccrual);
    const frequency = loan.interest_frequency || 'monthly';

    if (frequency === 'monthly') {
      lastDate.setMonth(lastDate.getMonth() + 1);
    } else {
      lastDate.setMonth(lastDate.getMonth() + 3);
    }

    const nextDate = lastDate.toISOString().split('T')[0];
    const today = todayISO();

    if (nextDate <= today) return 'Now (overdue)';

    const daysUntil = daysBetween(today, nextDate);
    return `${nextDate} (in ${daysUntil} days)`;
  };

  const getCOIForArtwork = (artworkId: string): COIRecord | undefined => {
    return coiRecords.find((c) => c.artwork_id === artworkId);
  };

  const coiStatusBadge = (artwork: Artwork) => {
    const coi = getCOIForArtwork(artwork.id);
    if (!coi || !coi.required) return <Badge tone="blue">Not required</Badge>;
    if (!coi.expires) return <Badge tone="red">Missing</Badge>;
    const d = inDays(coi.expires);
    if (d < 0) return <Badge tone="red">Expired</Badge>;
    if (d <= 30) return <Badge tone="blue">Due {d}d</Badge>;
    return <Badge tone="green">Valid</Badge>;
  };

  const uccStatus = (loan: Loan) => {
    if (!loan.ucc_filed) return { tone: 'red' as const, label: 'Not filed' };
    if (!loan.ucc_continuation_due) return { tone: 'blue' as const, label: 'Filed' };
    const d = inDays(loan.ucc_continuation_due);
    if (d < 0) return { tone: 'red' as const, label: 'Lapsed' };
    if (d <= 90) return { tone: 'blue' as const, label: `Continuation due ${d}d` };
    return { tone: 'green' as const, label: 'Filed' };
  };

  const deleteTx = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const deleteDoc = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }
      setDocuments(documents.filter((d) => d.id !== id));
    }
  };

  const deleteLoan = async (id: string) => {
    if (!confirm('Delete this loan and all its transactions?')) return;
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (!error) {
      setLoans(loans.filter((l) => l.id !== id));
      setTransactions(transactions.filter((t) => t.loan_id !== id));
    }
  };

  const postInterestDue = async (loan: Loan) => {
    const accrued = previewAccrued(loan);
    if (accrued <= 0) {
      alert('No interest to post');
      return;
    }

    if (!confirm(`Post $${accrued.toFixed(2)} in interest due for this loan?`)) return;

    try {
      const { error: txError } = await supabase.from('transactions').insert([
        {
          loan_id: loan.id,
          date: todayISO(),
          type: 'interest_due',
          amount: accrued,
          note: `Interest due from ${loan.last_accrual_date || loan.start_date} to ${todayISO()}`,
        },
      ]);

      if (txError) throw txError;

      const { error: loanError } = await supabase
        .from('loans')
        .update({ last_accrual_date: todayISO() })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      alert('Interest due posted successfully');
      loadData();
    } catch (error) {
      console.error('Error posting interest due:', error);
      alert('Failed to post interest due');
    }
  };

  const recordInterestPayment = async (loan: Loan) => {
    const due = interestDue(loan.id);
    if (due <= 0) {
      alert('No interest payment due on this loan');
      return;
    }

    const amountStr = prompt(`Enter interest payment amount received (Outstanding: $${due.toFixed(2)}):`, due.toFixed(2));
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    try {
      const { error } = await supabase.from('transactions').insert([
        {
          loan_id: loan.id,
          date: todayISO(),
          type: 'interest_payment',
          amount: amount,
          note: `Interest payment received`,
        },
      ]);

      if (error) throw error;

      alert('Interest payment recorded successfully');
      loadData();
    } catch (error) {
      console.error('Error recording interest payment:', error);
      alert('Failed to record interest payment');
    }
  };

  const sendStatement = async (loan: Loan, type: 'monthly_statement' | 'interest_invoice') => {
    if (!borrower?.contact) {
      alert('No email address found for this borrower. Please add an email in the contact field.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(borrower.contact)) {
      alert('Invalid email address in borrower contact field.');
      return;
    }

    if (!confirm(`Send ${type === 'monthly_statement' ? 'statement' : 'invoice'} to ${borrower.contact}?`)) return;

    try {
      const loanTxs = transactions
        .filter((t) => t.loan_id === loan.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const result = await sendStatementEmail(
        borrower.contact,
        {
          loan,
          borrower,
          transactions: loanTxs,
          artworks: getLoanArtworks(loan.id),
          balance: loanBalance(loan.id),
          apr: currentAPR(loan),
          ltv: ltvPct(loan),
          accruedInterest: previewAccrued(loan),
        },
        type
      );

      if (result.success) {
        alert(`${type === 'monthly_statement' ? 'Statement' : 'Invoice'} sent successfully to ${borrower.contact}`);
      } else {
        alert(`Failed to send: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending statement:', error);
      alert('Failed to send statement');
    }
  };

  const addLogo = (doc: jsPDF, startY: number): number => {
    doc.setDrawColor(230, 57, 70);
    doc.setLineWidth(0.8);

    const centerX = 105;
    const centerY = startY;
    const radius = 20;

    doc.ellipse(centerX, centerY, radius, radius, 'D');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CURATED.', centerX, centerY + 2, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('C A P I T A L   G R O U P', centerX, centerY + 8, { align: 'center' });

    return startY + 25;
  };

  const downloadInterestInvoice = (loan: Loan) => {
    const doc = new jsPDF();
    let y = 20;

    y = addLogo(doc, y);
    y += 5;

    doc.setFontSize(16);
    doc.text('INTEREST INVOICE', 105, y, { align: 'center' });
    y += 15;

    const apr = currentAPR(loan);
    const accruedInterest = previewAccrued(loan);
    const outstandingInterest = interestDue(loan.id);
    const invoiceDate = todayISO();

    doc.setFontSize(11);
    doc.text('INVOICE DETAILS', 14, y);
    y += 8;
    doc.setFontSize(10);

    const add = (label: string, value: string) => {
      doc.text(label, 14, y);
      doc.text(value, 120, y);
      y += 6;
    };

    add('Invoice Date:', invoiceDate);
    add('Borrower:', borrower?.name || 'Unknown');
    add('Loan ID:', loan.id.slice(0, 8));
    y += 4;

    doc.setFontSize(11);
    doc.text('INTEREST CALCULATION', 14, y);
    y += 8;
    doc.setFontSize(10);

    const balance = loanBalance(loan.id);
    add('Principal Balance:', currency(balance));
    add('Annual Percentage Rate:', `${apr.toFixed(2)}%`);
    add('Rate Type:', loan.rate_type === 'floating'
      ? `Floating (Prime ${settings?.prime_rate.toFixed(2)}% + ${loan.spread.toFixed(2)}%)`
      : 'Fixed');

    if (outstandingInterest > 0) {
      y += 4;
      doc.setFontSize(11);
      doc.text('OUTSTANDING BALANCE', 14, y);
      y += 8;
      doc.setFontSize(10);
      add('Previous Interest Due:', currency(outstandingInterest));
    }

    add('New Interest Accrued:', currency(accruedInterest));
    y += 4;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    add('TOTAL AMOUNT DUE:', currency(accruedInterest + outstandingInterest));
    doc.setFont('helvetica', 'normal');

    y += 10;
    doc.setFontSize(9);
    doc.text('Please remit payment to Curated Capital Group.', 14, y);
    y += 5;
    doc.text('This invoice reflects accrued interest as of the invoice date.', 14, y);

    doc.save(`interest_invoice_${loan.id.slice(0, 8)}_${invoiceDate}.pdf`);
  };

  const downloadValuationSummary = (loan: Loan) => {
    const doc = new jsPDF();
    let y = 20;

    y = addLogo(doc, y);
    y += 5;

    doc.setFontSize(16);
    doc.text('COLLATERAL VALUATION SUMMARY', 105, y, { align: 'center' });
    y += 15;

    const balance = loanBalance(loan.id);
    const collateralArts = getLoanArtworks(loan.id);
    const totalValue = collateralArts.reduce((sum, a) => sum + a.appraised_value, 0);
    const ltv = ltvPct(loan);

    doc.setFontSize(11);
    doc.text('LOAN SUMMARY', 14, y);
    y += 8;
    doc.setFontSize(10);

    const add = (label: string, value: string) => {
      doc.text(label, 14, y);
      doc.text(value, 120, y);
      y += 6;
    };

    add('Report Date:', todayISO());
    add('Borrower:', borrower?.name || 'Unknown');
    add('Loan ID:', loan.id.slice(0, 8));
    add('Current Balance:', currency(balance));
    y += 4;

    doc.setFontSize(11);
    doc.text('COLLATERAL ARTWORKS', 14, y);
    y += 8;
    doc.setFontSize(10);

    collateralArts.forEach((art, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${idx + 1}. ${art.artist} - ${art.title}`, 14, y);
      y += 6;
      doc.text(`   Appraised Value: ${currency(art.appraised_value)}`, 14, y);
      if (art.appraisal_date) {
        y += 6;
        doc.text(`   Appraisal Date: ${art.appraisal_date}`, 14, y);
      }
      if (art.dimensions) {
        y += 6;
        doc.text(`   Dimensions: ${art.dimensions}`, 14, y);
      }
      y += 8;
    });

    y += 4;
    doc.setFontSize(11);
    doc.text('VALUATION ANALYSIS', 14, y);
    y += 8;
    doc.setFontSize(10);

    add('Total Collateral Value:', currency(totalValue));
    add('Loan to Value Ratio:', `${ltv.toFixed(2)}%`);
    add('LTV Limit:', `${settings?.ltv_limit || 45}%`);
    add('Status:', ltv > (settings?.ltv_limit || 45) ? 'OVER LIMIT' : 'Within Limit');

    y += 10;
    doc.setFontSize(9);
    doc.text('This summary is based on the most recent appraisals on file.', 14, y);
    y += 5;
    doc.text('Valuations may change over time and should be reviewed periodically.', 14, y);

    doc.save(`valuation_summary_${loan.id.slice(0, 8)}_${todayISO()}.pdf`);
  };

  const downloadLenderIncome = (loan: Loan) => {
    if (!borrower) return;

    const collateralArts = getLoanArtworks(loan.id);
    const totalAppraisedValue = collateralArts.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateLenderIncomeStatementPDF({
      loan,
      borrower,
      artworks: collateralArts,
      totalAppraisedValue
    });

    pdf.save(`Lender_Income_Statement_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  const downloadStatementPDF = (loan: Loan) => {
    const doc = new jsPDF();
    let y = 20;

    y = addLogo(doc, y);
    y += 5;

    doc.setFontSize(14);
    doc.text('Loan Statement', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(10);

    const apr = currentAPR(loan).toFixed(2);
    const bal = currency(loanBalance(loan.id));
    const intDue = interestDue(loan.id);
    const fees = feesDue(loan.id);
    const ltv = ltvPct(loan).toFixed(2);

    const add = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    };

    add('Borrower', borrower?.name || 'Unknown');
    add('Loan ID', loan.id);
    add('Statement Date', todayISO());
    add(
      'Rate',
      `${apr}% ${
        loan.rate_type === 'floating'
          ? `(Prime ${settings?.prime_rate.toFixed(2)}% + ${loan.spread.toFixed(2)}%)`
          : '(Fixed)'
      }`
    );
    add('Principal Balance', bal);
    if (intDue > 0) {
      add('Interest Due (Outstanding)', currency(intDue));
    }
    if (fees > 0) {
      add('Fees Due (Outstanding)', currency(fees));
    }
    add('Current LTV', `${ltv}% (limit ${settings?.ltv_limit}%)`);

    if (loan.ucc_filed) {
      y += 4;
      doc.setFontSize(11);
      doc.text('UCC Filing', 14, y);
      y += 6;
      doc.setFontSize(10);
      add('Jurisdiction', loan.ucc_jurisdiction);
      add('Filing Number', loan.ucc_filing_number);
      if (loan.ucc_filing_date) add('Filing Date', loan.ucc_filing_date);
      if (loan.ucc_continuation_due) add('Continuation Due', loan.ucc_continuation_due);
    }

    const loanTxs = transactions
      .filter((t) => t.loan_id === loan.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    y += 4;
    doc.setFontSize(11);
    doc.text('Transactions', 14, y);
    y += 6;
    doc.setFontSize(10);

    const formatType = (type: string) => {
      if (type === 'interest_due') return 'Int Due';
      if (type === 'interest_payment') return 'Int Paid';
      if (type === 'fee_payment') return 'Fee Paid';
      return type.slice(0, 10);
    };

    const rows = [
      'Date        Type        Amount        Note',
      ...loanTxs.map(
        (t) =>
          `${t.date.padEnd(10, ' ')}  ${formatType(t.type).padEnd(10, ' ')}  ${Number(t.amount)
            .toFixed(2)
            .padStart(10, ' ')}  ${(t.note || '').slice(0, 60)}`
      ),
    ];

    rows.forEach((line) => {
      doc.text(line, 14, y);
      y += 5;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    });

    const accrued = currency(previewAccrued(loan));
    y += 4;
    add('Accrued (unposted) Interest', accrued);

    doc.save(`statement_${loan.id}_${todayISO()}.pdf`);
  };

  const downloadBorrowerBalanceSheet = () => {
    if (!borrower) return;

    const doc = new jsPDF();
    let y = 20;

    const allTxs = transactions
      .filter((t) => loans.some(l => l.id === t.loan_id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAdvanced = allTxs
      .filter(t => t.type === 'advance')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalRepaid = allTxs
      .filter(t => t.type === 'repayment')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalIntDue = allTxs
      .filter(t => t.type === 'interest_due')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalIntPaid = allTxs
      .filter(t => t.type === 'interest_payment')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalFees = allTxs
      .filter(t => t.type === 'fee')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalFeesPaid = allTxs
      .filter(t => t.type === 'fee_payment')
      .reduce((s, t) => s + Number(t.amount), 0);

    y = addLogo(doc, y);
    y += 5;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BORROWER BALANCE SHEET', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text('Complete Transaction History', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Borrower: ${borrower.name}`, 14, y);
    y += 6;
    doc.text(`Statement Date: ${todayISO()}`, 14, y);
    y += 12;

    const add = (label: string, value: string, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, 14, y);
      doc.text(value, 200, y, { align: 'right' });
      y += 6;
    };

    // Summary by loan
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LOAN SUMMARY', 14, y);
    y += 8;

    doc.setFontSize(10);
    let totalPrincipal = 0;
    let totalIntFees = 0;

    loans.forEach((loan) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const balance = loanBalance(loan.id);
      const intDue = interestDue(loan.id);
      const fees = feesDue(loan.id);
      const facility = facilities.find(f => f.id === loan.facility_id);

      totalPrincipal += balance;
      totalIntFees += (intDue + fees);

      doc.setFont('helvetica', 'bold');
      doc.text(loan.loan_name || `Loan ${loan.id.slice(0, 8)}`, 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      add('  Facility:', facility?.name || 'N/A');
      add('  Principal Balance:', currency(balance));
      add('  Interest & Fees Due:', currency(intDue + fees));
      add('  APR:', `${currentAPR(loan).toFixed(2)}%`);
      add('  Status:', loan.status);
      y += 4;
    });

    doc.line(14, y, 200, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    add('Total Principal Outstanding:', currency(totalPrincipal), true);
    add('Total Interest & Fees Due:', currency(totalIntFees), true);
    add('Total Amount Owed:', currency(totalPrincipal + totalIntFees), true);
    y += 10;

    // All Transactions section
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLETE TRANSACTION HISTORY', 14, y);
    y += 8;

    if (allTxs.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No transactions recorded.', 14, y);
      y += 10;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 14, y);
      doc.text('Loan', 38, y);
      doc.text('Facility', 70, y);
      doc.text('Type', 110, y);
      doc.text('Amount', 170, y, { align: 'right' });
      y += 4;
      doc.line(14, y, 200, y);
      y += 4;

      doc.setFont('helvetica', 'normal');

      let runningPrincipal = 0;
      let runningIntFees = 0;

      allTxs.forEach((tx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        const loan = loans.find(l => l.id === tx.loan_id);
        const facility = facilities.find(f => f.id === loan?.facility_id);
        const loanName = loan?.loan_name || loan?.id.slice(0, 8) || '—';
        const facilityName = facility?.name || '—';

        const typeDisplay = tx.type === 'interest_due' ? 'Int Due' :
                           tx.type === 'interest_payment' ? 'Int Paid' :
                           tx.type === 'fee_payment' ? 'Fee Paid' :
                           tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

        // Calculate running totals
        if (tx.type === 'advance') runningPrincipal += Number(tx.amount);
        if (tx.type === 'repayment') runningPrincipal -= Number(tx.amount);
        if (tx.type === 'interest_due' || tx.type === 'fee') runningIntFees += Number(tx.amount);
        if (tx.type === 'interest_payment' || tx.type === 'fee_payment') runningIntFees -= Number(tx.amount);

        doc.text(tx.date, 14, y);
        doc.text(loanName.slice(0, 14), 38, y);
        doc.text(facilityName.slice(0, 18), 70, y);
        doc.text(typeDisplay, 110, y);
        doc.text(currency(Number(tx.amount)), 170, y, { align: 'right' });
        y += 5;
      });

      y += 3;
      doc.line(14, y, 200, y);
      y += 6;
    }

    // Detailed breakdown by transaction type
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION SUMMARY BY TYPE', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    add('Total Principal Advanced:', currency(totalAdvanced));
    add('Total Principal Repaid:', currency(totalRepaid));
    add('Net Principal Outstanding:', currency(totalAdvanced - totalRepaid), true);
    y += 3;

    add('Total Interest Invoiced:', currency(totalIntDue));
    add('Total Interest Paid:', currency(totalIntPaid));
    add('Net Interest Due:', currency(totalIntDue - totalIntPaid), true);
    y += 3;

    add('Total Fees Charged:', currency(totalFees));
    add('Total Fees Paid:', currency(totalFeesPaid));
    add('Net Fees Due:', currency(totalFees - totalFeesPaid), true);
    y += 6;

    doc.line(14, y, 200, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    add('TOTAL AMOUNT OWED:', currency((totalAdvanced - totalRepaid) + (totalIntDue - totalIntPaid) + (totalFees - totalFeesPaid)), true);
    y += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This balance sheet reflects all transactions for all loans associated with this borrower.', 14, y);
    y += 4;
    doc.text('For questions, please contact Curated Capital Group.', 14, y);

    const fileName = `balance_sheet_${borrower.name.replace(/\s+/g, '_')}_${todayISO()}.pdf`;
    doc.save(fileName);
  };

  const handleAddCOI = async () => {
    if (!selectedArtworkId || !coiCarrier || !coiPolicyNumber) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase.from('coi_records').insert([{
      artwork_id: selectedArtworkId,
      required: true,
      carrier: coiCarrier,
      policy_number: coiPolicyNumber,
      expires: coiExpires || null,
      limit_amount: coiLimitAmount ? parseFloat(coiLimitAmount) : 0,
    }]);

    if (error) {
      alert(`Error adding COI: ${error.message}`);
      return;
    }

    alert('COI record added successfully');
    setQuickActionType(null);
    setCoiCarrier('');
    setCoiPolicyNumber('');
    setCoiExpires('');
    setCoiLimitAmount('');
    setSelectedArtworkId('');
    loadData();
  };

  const handleUpdateUCC = async () => {
    if (!selectedLoanId || !uccJurisdiction || !uccFilingNumber) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase.from('loans').update({
      ucc_filed: true,
      ucc_jurisdiction: uccJurisdiction,
      ucc_filing_number: uccFilingNumber,
      ucc_filing_date: uccFilingDate || null,
      ucc_continuation_due: uccContinuationDue || null,
      ucc_collateral_desc: uccCollateralDesc,
    }).eq('id', selectedLoanId);

    if (error) {
      alert(`Error updating UCC: ${error.message}`);
      return;
    }

    alert('UCC information updated successfully');
    setQuickActionType(null);
    setUccJurisdiction('');
    setUccFilingNumber('');
    setUccFilingDate('');
    setUccContinuationDue('');
    setUccCollateralDesc('');
    setSelectedLoanId('');
    loadData();
  };

  const handleAddTransaction = async () => {
    if (!selectedLoanId || !txAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase.from('transactions').insert([{
      loan_id: selectedLoanId,
      date: txDate,
      type: txType,
      amount: parseFloat(txAmount),
      note: txNote,
    }]);

    if (error) {
      alert(`Error adding transaction: ${error.message}`);
      return;
    }

    alert('Transaction recorded successfully');
    setQuickActionType(null);
    setTxAmount('');
    setTxNote('');
    setSelectedLoanId('');
    loadData();
  };

  const handleChangeFrequency = async (loanId: string, newFrequency: 'monthly' | 'quarterly') => {
    try {
      const { error } = await supabase
        .from('loans')
        .update({ interest_frequency: newFrequency })
        .eq('id', loanId);

      if (error) throw error;

      alert(`Interest frequency updated to ${newFrequency}`);
      setChangingFrequencyLoanId(null);
      loadData();
    } catch (error) {
      console.error('Error changing interest frequency:', error);
      alert('Failed to change interest frequency');
    }
  };

  const handleChangeRate = async (loanId: string) => {
    if (!rateChangeReason.trim()) {
      alert('Please provide a reason for the rate change');
      return;
    }

    try {
      const primeBps = settings?.prime_rate_bps || 0;
      let newRateBps = 0;

      if (newRateType === 'floating') {
        const spreadVal = parseFloat(newSpread);
        if (isNaN(spreadVal)) {
          alert('Please enter a valid spread percentage');
          return;
        }
        newRateBps = primeBps + (spreadVal * 100);
      } else {
        const fixedVal = parseFloat(newFixedApr);
        if (isNaN(fixedVal)) {
          alert('Please enter a valid fixed APR');
          return;
        }
        newRateBps = fixedVal * 100;
      }

      const { error: rateChangeError } = await supabase
        .from('interest_rate_changes')
        .insert({
          loan_id: loanId,
          effective_date: rateChangeEffectiveDate,
          previous_rate_type: loans.find(l => l.id === loanId)?.rate_type || 'floating',
          previous_rate_bps: loans.find(l => l.id === loanId)?.interest_rate_bps || 0,
          new_rate_type: newRateType,
          new_rate_bps: newRateBps,
          reason: rateChangeReason,
          changed_by: userEmail,
        });

      if (rateChangeError) throw rateChangeError;

      const updateData: Record<string, unknown> = {
        rate_type: newRateType,
        interest_rate_bps: newRateBps,
        interest_rate_override_bps: newRateBps,
      };

      if (newRateType === 'floating') {
        updateData.spread = parseFloat(newSpread);
        updateData.fixed_apr = null;
      } else {
        updateData.fixed_apr = parseFloat(newFixedApr);
        updateData.spread = null;
      }

      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update(updateData)
        .eq('id', loanId);

      if (loanUpdateError) throw loanUpdateError;

      alert('Interest rate updated successfully');
      setChangingRateLoanId(null);
      setNewSpread('');
      setNewFixedApr('');
      setRateChangeReason('');
      loadData();
    } catch (error: unknown) {
      alert(`Error updating rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const borrowerLoans = loans;
  const borrowerLoanIds = new Set(borrowerLoans.map((l) => l.id));
  const borrowerTxs = transactions.filter((t) => borrowerLoanIds.has(t.loan_id));
  const artworkIds = new Set<string>();
  borrowerLoans.forEach((l) => {
    getLoanArtworks(l.id).forEach((a) => artworkIds.add(a.id));
  });
  const borrowerArts = artworks.filter((a) => artworkIds.has(a.id));

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!borrower) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div>
          <p className="text-gray-600 mb-4">Borrower not found</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Curated Capital Group" className="h-16 w-auto" />
            <div>
              <p className="text-xs text-gray-500 -mb-1">Art Financing System</p>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-center">Borrower — {borrower.name}</h1>
            <p className="text-xs text-gray-500 text-center">
              Contact: {borrower.contact || '—'} · Note: {borrower.note || '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">
              <Badge tone="blue">{userEmail}</Badge>
            </div>
            <Button variant="solid" onClick={downloadBorrowerBalanceSheet}>
              Download Balance Sheet
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Active Loans</div>
            <div className="text-3xl font-bold">{borrowerLoans.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Documents</div>
            <div className="text-3xl font-bold">{documents.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Collateral Artworks</div>
            <div className="text-3xl font-bold">{borrowerArts.length}</div>
          </div>
        </div>

        <Section title="Quick Actions" collapsible defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setQuickActionType(quickActionType === 'coi' ? null : 'coi')}
              className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Add COI
            </button>
            <button
              onClick={() => setQuickActionType(quickActionType === 'ucc' ? null : 'ucc')}
              className="px-4 py-3 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700"
            >
              Update UCC
            </button>
            <button
              onClick={() => setQuickActionType(quickActionType === 'transaction' ? null : 'transaction')}
              className="px-4 py-3 rounded-xl bg-orange-600 text-white text-sm hover:bg-orange-700"
            >
              Record Transaction
            </button>
          </div>

          {quickActionType === 'coi' && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
              <h3 className="font-semibold text-sm mb-3 text-blue-900">Add Certificate of Insurance (COI)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">Artwork *</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={selectedArtworkId}
                    onChange={(e) => setSelectedArtworkId(e.target.value)}
                    required
                  >
                    <option value="">Select artwork...</option>
                    {borrowerArts.map((a) => (
                      <option key={a.id} value={a.id}>{a.title} by {a.artist}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Insurance Carrier *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={coiCarrier}
                    onChange={(e) => setCoiCarrier(e.target.value)}
                    placeholder="Carrier name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Policy Number *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={coiPolicyNumber}
                    onChange={(e) => setCoiPolicyNumber(e.target.value)}
                    placeholder="Policy number"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Expiration Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={coiExpires}
                    onChange={(e) => setCoiExpires(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Coverage Limit Amount</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={coiLimitAmount}
                    onChange={(e) => setCoiLimitAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
                  onClick={handleAddCOI}
                >
                  Save COI
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                  onClick={() => setQuickActionType(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {quickActionType === 'ucc' && (
            <div className="border border-green-200 rounded-xl p-4 bg-green-50">
              <h3 className="font-semibold text-sm mb-3 text-green-900">Update UCC Filing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">Loan *</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    required
                  >
                    <option value="">Select loan...</option>
                    {borrowerLoans.map((l) => (
                      <option key={l.id} value={l.id}>{l.loan_name || `Loan ${l.id.slice(0, 8)}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Jurisdiction *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={uccJurisdiction}
                    onChange={(e) => setUccJurisdiction(e.target.value)}
                    placeholder="State or jurisdiction"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Filing Number *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={uccFilingNumber}
                    onChange={(e) => setUccFilingNumber(e.target.value)}
                    placeholder="UCC filing number"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Filing Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={uccFilingDate}
                    onChange={(e) => setUccFilingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Continuation Due Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={uccContinuationDue}
                    onChange={(e) => setUccContinuationDue(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-700">Collateral Description</label>
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={uccCollateralDesc}
                    onChange={(e) => setUccCollateralDesc(e.target.value)}
                    placeholder="Description of collateral"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700"
                  onClick={handleUpdateUCC}
                >
                  Save UCC Info
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                  onClick={() => setQuickActionType(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {quickActionType === 'transaction' && (
            <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
              <h3 className="font-semibold text-sm mb-3 text-orange-900">Record Transaction</h3>
              <div className="mb-3 p-3 bg-white rounded-lg border border-orange-100">
                <p className="text-xs text-gray-600">
                  <strong>Transaction Types:</strong><br/>
                  • <strong>Advance:</strong> Money lent to borrower (increases loan balance)<br/>
                  • <strong>Repayment:</strong> Principal payment received (decreases loan balance)<br/>
                  • <strong>Interest Payment:</strong> Interest payment received (reduces interest due)<br/>
                  • <strong>Fee Payment:</strong> Fee payment received (reduces fees due)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">Loan *</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    required
                  >
                    <option value="">Select loan...</option>
                    {borrowerLoans.map((l) => (
                      <option key={l.id} value={l.id}>{l.loan_name || `Loan ${l.id.slice(0, 8)}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Transaction Type *</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'advance' | 'repayment' | 'interest_due' | 'interest_payment' | 'fee' | 'fee_payment')}
                    required
                  >
                    <option value="advance">Advance (Loan to Borrower)</option>
                    <option value="repayment">Repayment (Pay Down Principal)</option>
                    <option value="interest_due">Interest Due (Invoice Interest)</option>
                    <option value="interest_payment">Interest Payment (Pay Interest Due)</option>
                    <option value="fee">Fee Due (Invoice Fee)</option>
                    <option value="fee_payment">Fee Payment (Pay Fees Due)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Amount *</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-700">Note</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="Optional note"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm hover:bg-orange-700"
                  onClick={handleAddTransaction}
                >
                  Save Transaction
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                  onClick={() => setQuickActionType(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Loans" collapsible>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Loan Name</th>
                  <th className="p-3 text-left">Facility</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-right">Interest Due</th>
                  <th className="p-3 text-right">APR</th>
                  <th className="p-3 text-right">LTV</th>
                  <th className="p-3 text-left">UCC</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowerLoans.map((l) => {
                  const facility = facilities.find((f) => f.id === l.facility_id);
                  const bal = loanBalance(l.id);
                  const intDue = interestDue(l.id);
                  const apr = currentAPR(l);
                  const ltv = ltvPct(l);
                  const warn = ltv > (settings?.ltv_limit || 45);
                  const u = uccStatus(l);

                  return (
                    <React.Fragment key={l.id}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{l.loan_name || `Loan ${l.id.slice(0, 8)}`}</td>
                        <td className="p-3 text-gray-600 text-xs">{facility ? facility.name : '—'}</td>
                        <td className="p-3 text-right">{currency(bal)}</td>
                        <td className="p-3 text-right">
                          {intDue > 0 ? <span className="text-red-600 font-semibold">{currency(intDue)}</span> : currency(0)}
                        </td>
                        <td className="p-3 text-right">{apr.toFixed(2)}%</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{ltv.toFixed(2)}%</span>
                            {warn ? <Badge tone="red">Over</Badge> : <Badge tone="green">OK</Badge>}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge tone={u.tone}>{u.label}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="mb-1 text-xs text-gray-600 text-right">
                              <strong>Interest Actions:</strong><br/>
                              1. Post Interest Due: Calculate & record what borrower owes<br/>
                              2. Record Payment: Record when borrower pays interest
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button variant="solid" onClick={() => postInterestDue(l)}>
                                1. Post Interest Due ({currency(previewAccrued(l))})
                              </Button>
                              {interestDue(l.id) > 0 && (
                                <Button variant="solid" onClick={() => recordInterestPayment(l)}>
                                  2. Record Payment ({currency(interestDue(l.id))})
                                </Button>
                              )}
                            {borrower?.contact && (
                              <>
                                <Button variant="outline" onClick={() => sendStatement(l, 'monthly_statement')}>
                                  Email Statement
                                </Button>
                                <Button variant="outline" onClick={() => sendStatement(l, 'interest_invoice')}>
                                  Email Invoice
                                </Button>
                              </>
                            )}
                            <Button variant="outline" onClick={() => downloadStatementPDF(l)}>
                              Download Statement
                            </Button>
                            <Button variant="outline" onClick={() => downloadInterestInvoice(l)}>
                              Download Invoice
                            </Button>
                            <Button variant="outline" onClick={() => downloadValuationSummary(l)}>
                              Valuation
                            </Button>
                            <Button variant="solid" onClick={() => downloadLenderIncome(l)} style={{ backgroundColor: '#2563eb' }}>
                              Lender Income
                            </Button>
                            <Button variant="solid" onClick={() => setChangingRateLoanId(l.id)}>
                              Change Rate
                            </Button>
                            <Button variant="outline" onClick={() => setChangingFrequencyLoanId(l.id)}>
                              Change Frequency ({l.interest_frequency || 'monthly'})
                            </Button>
                            <Button variant="danger" onClick={() => deleteLoan(l.id)}>
                              Delete
                            </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Accruing from {l.last_accrual_date || l.start_date} ({daysBetween(l.last_accrual_date || l.start_date, todayISO())} days)<br/>
                              Next {l.interest_frequency || 'monthly'} interest due: {getNextInterestDueDate(l)}
                            </p>
                          </div>
                        </td>
                      </tr>
                      {changingRateLoanId === l.id && (
                        <tr className="border-t">
                          <td colSpan={7} className="p-4 bg-purple-50">
                            <h3 className="font-semibold text-sm mb-3">Change Interest Rate</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Current rate: <strong>{l.rate_type === 'fixed' ? `${((l.interest_rate_bps || 0) / 100).toFixed(2)}% Fixed` : `Prime + ${l.spread}% (${((l.interest_rate_bps || 0) / 100).toFixed(2)}% total)`}</strong>
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-sm text-gray-700">Rate Type *</label>
                                <select
                                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                                  value={newRateType}
                                  onChange={(e) => setNewRateType(e.target.value as 'fixed' | 'floating')}
                                >
                                  <option value="floating">Floating (Prime + Spread)</option>
                                  <option value="fixed">Fixed APR</option>
                                </select>
                              </div>

                              {newRateType === 'floating' ? (
                                <div>
                                  <label className="text-sm text-gray-700">Spread (%) *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                                    value={newSpread}
                                    onChange={(e) => setNewSpread(e.target.value)}
                                    placeholder="5.00"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Prime: {((settings?.prime_rate_bps || 0) / 100).toFixed(2)}% → Total: {((settings?.prime_rate_bps || 0) / 100 + parseFloat(newSpread || '0')).toFixed(2)}%
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <label className="text-sm text-gray-700">Fixed APR (%) *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                                    value={newFixedApr}
                                    onChange={(e) => setNewFixedApr(e.target.value)}
                                    placeholder="10.00"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="text-sm text-gray-700">Effective Date *</label>
                                <input
                                  type="date"
                                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                                  value={rateChangeEffectiveDate}
                                  onChange={(e) => setRateChangeEffectiveDate(e.target.value)}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-sm text-gray-700">Reason for Change *</label>
                                <textarea
                                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                                  rows={2}
                                  value={rateChangeReason}
                                  onChange={(e) => setRateChangeReason(e.target.value)}
                                  placeholder="e.g., Market conditions, borrower request, etc."
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="solid" onClick={() => handleChangeRate(l.id)}>
                                Apply Rate Change
                              </Button>
                              <Button variant="outline" onClick={() => setChangingRateLoanId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {changingFrequencyLoanId === l.id && (
                        <tr className="border-t">
                          <td colSpan={7} className="p-4 bg-blue-50">
                            <h3 className="font-semibold text-sm mb-3">Change Interest Frequency</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Current frequency: <strong>{l.interest_frequency || 'monthly'}</strong>
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="solid"
                                onClick={() => handleChangeFrequency(l.id, 'monthly')}
                                disabled={l.interest_frequency === 'monthly'}
                              >
                                Switch to Monthly
                              </Button>
                              <Button
                                variant="solid"
                                onClick={() => handleChangeFrequency(l.id, 'quarterly')}
                                disabled={l.interest_frequency === 'quarterly'}
                              >
                                Switch to Quarterly
                              </Button>
                              <Button variant="outline" onClick={() => setChangingFrequencyLoanId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Collateral Artworks" collapsible>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Artist</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Dimensions</th>
                  <th className="text-left p-3">Materials</th>
                  <th className="text-right p-3">Appraised</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">COI</th>
                  <th className="text-left p-3">Fact Sheet</th>
                </tr>
              </thead>
              <tbody>
                {borrowerArts.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{a.artist}</td>
                    <td className="p-3">{a.title}</td>
                    <td className="p-3">{a.dimensions || '—'}</td>
                    <td className="p-3">{a.materials || '—'}</td>
                    <td className="p-3 text-right">{currency(a.appraised_value)}</td>
                    <td className="p-3">{a.location || '—'}</td>
                    <td className="p-3">{coiStatusBadge(a)}</td>
                    <td className="p-3">
                      {a.fact_sheet_url ? (
                        <a
                          href={a.fact_sheet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Transactions" collapsible>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Loan</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Note</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowerTxs
                  .slice()
                  .reverse()
                  .map((t) => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{t.date}</td>
                      <td className="p-3 font-mono text-xs">{String(t.loan_id).slice(0, 8)}</td>
                      <td className="p-3">
                        <Badge>{t.type}</Badge>
                      </td>
                      <td className="p-3 text-right">{currency(t.amount)}</td>
                      <td className="p-3">{t.note}</td>
                      <td className="p-3 text-right">
                        <Button variant="danger" onClick={() => deleteTx(t.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Interest Rate Change History" collapsible>
          {rateChanges.filter(rc => loans.some(l => l.id === rc.loan_id)).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rate changes recorded yet.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Effective Date</th>
                    <th className="p-3 text-left">Loan</th>
                    <th className="p-3 text-left">Rate Type</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rateChanges
                    .filter(rc => loans.some(l => l.id === rc.loan_id))
                    .map((rc) => {
                      const loan = loans.find(l => l.id === rc.loan_id);
                      const rateDisplay = rc.rate_type === 'fixed'
                        ? `${Number(rc.fixed_apr).toFixed(2)}% Fixed`
                        : `Prime + ${Number(rc.spread).toFixed(2)}%`;

                      return (
                        <tr key={rc.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{rc.effective_date}</td>
                          <td className="p-3 font-medium">{loan?.loan_name || 'Unknown'}</td>
                          <td className="p-3 capitalize">
                            <Badge tone={rc.rate_type === 'fixed' ? 'blue' : 'green'}>{rc.rate_type}</Badge>
                          </td>
                          <td className="p-3 text-right font-semibold">{rateDisplay}</td>
                          <td className="p-3 text-gray-600">{rc.note || '—'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Documents" collapsible>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Note</th>
                  <th className="p-3 text-right">Size</th>
                  <th className="p-3 text-left">Uploaded</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => {
                  const isImg = (d.type || '').startsWith('image/');
                  return (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3">
                        <Badge>{isImg ? 'Image' : 'File'}</Badge>
                      </td>
                      <td className="p-3">{d.note}</td>
                      <td className="p-3 text-right">{(d.size / 1024).toFixed(1)} KB</td>
                      <td className="p-3">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage.from('documents').download(d.storage_path);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = d.name;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button variant="danger" onClick={() => deleteDoc(d.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
};
