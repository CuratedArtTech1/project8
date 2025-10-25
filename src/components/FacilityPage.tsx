import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Section, Button, Badge } from './UI';
import { currency, todayISO } from '../lib/utils';
import { jsPDF } from 'jspdf';
// import { FacilityTransactionForm } from './forms/FacilityTransactionForm';
// import { LenderPaymentForm } from './forms/LenderPaymentForm';
import type {
  LenderFacility,
  Loan,
  Borrower,
  Transaction,
  Settings,
  FacilityTransaction,
  LoanTransfer,
  FacilityHistory,
  LenderPayment,
} from '../types';

interface FacilityPageProps {
  facilityId: string;
  onBack: () => void;
  onViewBorrower: (borrowerId: string) => void;
  onViewLoan: (borrowerId: string) => void;
}

export const FacilityPage: React.FC<FacilityPageProps> = ({
  facilityId,
  onBack,
  onViewBorrower,
  onViewLoan
}) => {
  const [facility, setFacility] = useState<LenderFacility | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [facilityTransactions, setFacilityTransactions] = useState<FacilityTransaction[]>([]);
  const [loanTransfers, setLoanTransfers] = useState<LoanTransfer[]>([]);
  const [facilityHistory, setFacilityHistory] = useState<FacilityHistory[]>([]);
  const [lenderPayments, setLenderPayments] = useState<LenderPayment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facilityRes, loansRes, borrowersRes, transactionsRes, facilityTxRes, transfersRes, historyRes, paymentsRes, settingsRes] = await Promise.all([
        supabase.from('lender_facilities').select('*').eq('id', facilityId).single(),
        supabase.from('loans').select('*').eq('facility_id', facilityId),
        supabase.from('borrowers').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('facility_transactions').select('*').eq('facility_id', facilityId).order('date', { ascending: false }),
        supabase.from('loan_transfers').select('*').or(`from_facility_id.eq.${facilityId},to_facility_id.eq.${facilityId}`).order('transfer_date', { ascending: false }),
        supabase.from('facility_history').select('*').eq('facility_id', facilityId).order('change_date', { ascending: false }),
        supabase.from('lender_payments').select('*').eq('facility_id', facilityId).order('payment_date', { ascending: false }),
        supabase.from('settings').select('*').limit(1).single(),
      ]);

      if (facilityRes.data) setFacility(facilityRes.data);
      if (loansRes.data) setLoans(loansRes.data);
      if (borrowersRes.data) setBorrowers(borrowersRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (facilityTxRes.data) setFacilityTransactions(facilityTxRes.data);
      if (transfersRes.data) setLoanTransfers(transfersRes.data);
      if (historyRes.data) setFacilityHistory(historyRes.data);
      if (paymentsRes.data) setLenderPayments(paymentsRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading facility data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [facilityId, loadData]);

  const loanBalance = (loanId: string): number => {
    const advances = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'advance')
      .reduce((s, t) => s + Number(t.amount), 0);
    const repayments = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'repayment')
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, advances - repayments);
  };

  const interestAndFeesDue = (loanId: string): number => {
    const interestDue = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'interest_due')
      .reduce((s, t) => s + Number(t.amount), 0);
    const interestPaid = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'interest_payment')
      .reduce((s, t) => s + Number(t.amount), 0);
    const feesDue = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'fee')
      .reduce((s, t) => s + Number(t.amount), 0);
    const feesPaid = transactions
      .filter((t) => t.loan_id === loanId && t.type === 'fee_payment')
      .reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, (interestDue - interestPaid) + (feesDue - feesPaid));
  };

  const currentAPR = (loan: Loan): number => {
    if (loan.rate_type === 'fixed') return Number(loan.fixed_apr);
    return Number(settings?.prime_rate || 0) + Number(loan.spread);
  };

  const generateFacilityStatement = () => {
    if (!facility) return;

    const doc = new jsPDF();
    const statementDate = todayISO();
    let y = 20;

    const add = (label: string, value: string, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, 14, y);
      doc.text(value, 200, y, { align: 'right' });
      y += 6;
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CURATED CAPITAL GROUP', 14, y);
    y += 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACILITY STATEMENT', 105, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Statement Date: ${statementDate}`, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Facility Information', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Facility Name:', facility.name);
    add('Lender:', facility.lender_name);
    add('Status:', facility.status);
    add('Interest Rate Floor:', `${Number(facility.interest_rate_floor).toFixed(2)}%`);
    add('Origination Fee:', `${Number(facility.origination_fee_pct).toFixed(2)}%`);
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Capacity & Utilization', 14, y);
    y += 8;

    const totalUtil = totalUtilization;
    const availCap = availableCapacity;
    const utilPct = utilizationPct;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Facility Limit:', currency(Number(facility.facility_limit)), true);
    add('Current Utilization:', currency(totalUtil), true);
    add('Available Capacity:', currency(availCap), true);
    add('Utilization Percentage:', `${utilPct.toFixed(2)}%`);
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Active Loans Summary', 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Borrower', 14, y);
    doc.text('Balance', 100, y, { align: 'right' });
    doc.text('APR', 130, y, { align: 'right' });
    doc.text('Rate Type', 160, y);
    doc.text('Start Date', 200, y, { align: 'right' });
    y += 5;
    doc.line(14, y, 200, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    loans.forEach((loan) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const borrower = borrowers.find(b => b.id === loan.borrower_id);
      const balance = loanBalance(loan.id);
      const apr = currentAPR(loan);

      doc.text(borrower?.name || 'Unknown', 14, y);
      doc.text(currency(balance), 100, y, { align: 'right' });
      doc.text(`${apr.toFixed(2)}%`, 130, y, { align: 'right' });
      doc.text(loan.rate_type, 160, y);
      doc.text(loan.start_date || '', 200, y, { align: 'right' });
      y += 6;
    });

    y += 5;
    doc.line(14, y, 200, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Outstanding Balance:', 14, y);
    doc.text(currency(totalUtil), 100, y, { align: 'right' });
    y += 10;

    // Last 30 days transactions
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transactions - Last 30 Days', 14, y);
    y += 8;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = transactions
      .filter((t) => facilityLoanIds.includes(t.loan_id) && new Date(t.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (recentTransactions.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No transactions in the last 30 days.', 14, y);
      y += 10;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 14, y);
      doc.text('Borrower', 40, y);
      doc.text('Loan', 90, y);
      doc.text('Type', 120, y);
      doc.text('Amount', 170, y, { align: 'right' });
      y += 4;
      doc.line(14, y, 200, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      recentTransactions.forEach((tx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        const loan = loans.find(l => l.id === tx.loan_id);
        const borrower = borrowers.find(b => b.id === loan?.borrower_id);
        const typeDisplay = tx.type === 'interest_due' ? 'Int Due' :
                           tx.type === 'interest_payment' ? 'Int Paid' :
                           tx.type === 'fee_payment' ? 'Fee Paid' :
                           tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

        doc.text(tx.date, 14, y);
        doc.text((borrower?.name || 'Unknown').slice(0, 20), 40, y);
        doc.text((loan?.loan_name || loan?.id.slice(0, 8) || '').slice(0, 12), 90, y);
        doc.text(typeDisplay, 120, y);
        doc.text(currency(Number(tx.amount)), 170, y, { align: 'right' });
        y += 5;
      });
    }

    y += 5;

    // Outstanding Interest & Fees
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Outstanding Interest & Fees Due', 14, y);
    y += 8;

    const loansWithDues = loans.map((loan) => {
      const borrower = borrowers.find(b => b.id === loan.borrower_id);
      const intFeesDue = interestAndFeesDue(loan.id);
      return { loan, borrower, intFeesDue };
    }).filter(item => item.intFeesDue > 0);

    if (loansWithDues.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No outstanding interest or fees.', 14, y);
      y += 10;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Borrower', 14, y);
      doc.text('Loan', 80, y);
      doc.text('Amount Due', 170, y, { align: 'right' });
      y += 4;
      doc.line(14, y, 200, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      loansWithDues.forEach(({ loan, borrower, intFeesDue }) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text((borrower?.name || 'Unknown').slice(0, 30), 14, y);
        doc.text((loan.loan_name || loan.id.slice(0, 8)).slice(0, 30), 80, y);
        doc.text(currency(intFeesDue), 170, y, { align: 'right' });
        y += 5;
      });

      y += 3;
      doc.line(14, y, 200, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Total Interest & Fees Due:', 14, y);
      doc.text(currency(totalInterestFeesDue), 170, y, { align: 'right' });
      y += 10;
    }

    // Summary section
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Total Principal Outstanding:', currency(totalUtil), true);
    add('Total Interest & Fees Due:', currency(totalInterestFeesDue), true);
    add('Total Owed to Lender:', currency(totalUtil + totalInterestFeesDue), true);
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This statement is for informational purposes only and reflects the current status of the facility.', 14, y);
    y += 4;
    doc.text('For questions, please contact Curated Capital Group.', 14, y);

    const fileName = `facility_statement_${facility.name.replace(/\s+/g, '_')}_${statementDate}.pdf`;
    doc.save(fileName);
  };

  const generateComprehensiveBalanceSheet = () => {
    if (!facility) return;

    const doc = new jsPDF();
    const statementDate = todayISO();
    let y = 20;

    const add = (label: string, value: string, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, 14, y);
      doc.text(value, 200, y, { align: 'right' });
      y += 6;
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CURATED CAPITAL GROUP', 14, y);
    y += 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPREHENSIVE FACILITY BALANCE SHEET', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text('Complete Transaction History & Lender Payments', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Facility: ${facility.name}`, 14, y);
    y += 6;
    doc.text(`Lender: ${facility.lender_name}`, 14, y);
    y += 6;
    doc.text(`Statement Date: ${statementDate}`, 14, y);
    y += 12;

    const allTxs = transactions
      .filter((t) => facilityLoanIds.includes(t.loan_id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAdvanced = allTxs.filter(t => t.type === 'advance').reduce((s, t) => s + Number(t.amount), 0);
    const totalIntDue = allTxs.filter(t => t.type === 'interest_due').reduce((s, t) => s + Number(t.amount), 0);
    const totalIntPaid = allTxs.filter(t => t.type === 'interest_payment').reduce((s, t) => s + Number(t.amount), 0);
    const totalFeesDue = allTxs.filter(t => t.type === 'fee').reduce((s, t) => s + Number(t.amount), 0);
    const totalFeesPaid = allTxs.filter(t => t.type === 'fee_payment').reduce((s, t) => s + Number(t.amount), 0);
    const totalPrincipalRepaid = allTxs.filter(t => t.type === 'repayment').reduce((s, t) => s + Number(t.amount), 0);

    const totalPaymentsToLender = lenderPayments.reduce((s, p) => s + Number(p.amount), 0);
    const interestPaidToLender = lenderPayments.filter(p => p.payment_type === 'interest').reduce((s, p) => s + Number(p.amount), 0);
    const principalPaidToLender = lenderPayments.filter(p => p.payment_type === 'principal').reduce((s, p) => s + Number(p.amount), 0);
    const feesPaidToLender = lenderPayments.filter(p => p.payment_type === 'fees').reduce((s, p) => s + Number(p.amount), 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACILITY SUMMARY', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Facility Limit:', currency(Number(facility.facility_limit)), true);
    add('Current Utilization:', currency(totalUtilization), true);
    add('Available Capacity:', currency(availableCapacity), true);
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BORROWER ACTIVITY SUMMARY', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Total Principal Advanced:', currency(totalAdvanced));
    add('Total Principal Repaid:', currency(totalPrincipalRepaid));
    add('Net Principal Outstanding:', currency(totalAdvanced - totalPrincipalRepaid), true);
    y += 3;
    add('Total Interest Due (Invoiced):', currency(totalIntDue));
    add('Total Interest Paid (by Borrowers):', currency(totalIntPaid));
    add('Net Interest Due:', currency(totalIntDue - totalIntPaid), true);
    y += 3;
    add('Total Fees Charged:', currency(totalFeesDue));
    add('Total Fees Paid (by Borrowers):', currency(totalFeesPaid));
    add('Net Fees Due:', currency(totalFeesDue - totalFeesPaid), true);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENTS TO LENDER', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    add('Interest Paid to Lender:', currency(interestPaidToLender), true);
    add('Principal Paid to Lender:', currency(principalPaidToLender), true);
    add('Fees Paid to Lender:', currency(feesPaidToLender), true);
    add('Total Paid to Lender:', currency(totalPaymentsToLender), true);
    y += 10;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ALL BORROWER TRANSACTIONS', 14, y);
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
      doc.text('Borrower', 38, y);
      doc.text('Loan', 75, y);
      doc.text('Type', 110, y);
      doc.text('Amount', 170, y, { align: 'right' });
      y += 4;
      doc.line(14, y, 200, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      allTxs.forEach((tx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        const loan = loans.find(l => l.id === tx.loan_id);
        const borrower = borrowers.find(b => b.id === loan?.borrower_id);
        const typeDisplay = tx.type === 'interest_due' ? 'Int Due' :
                           tx.type === 'interest_payment' ? 'Int Paid' :
                           tx.type === 'fee_payment' ? 'Fee Paid' :
                           tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

        doc.text(tx.date, 14, y);
        doc.text((borrower?.name || 'Unknown').slice(0, 16), 38, y);
        doc.text((loan?.loan_name || loan?.id.slice(0, 8) || '').slice(0, 16), 75, y);
        doc.text(typeDisplay, 110, y);
        doc.text(currency(Number(tx.amount)), 170, y, { align: 'right' });
        y += 5;
      });
    }

    y += 5;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENTS TO LENDER DETAIL', 14, y);
    y += 8;

    if (lenderPayments.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No payments to lender recorded.', 14, y);
      y += 10;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 14, y);
      doc.text('Type', 38, y);
      doc.text('Borrower', 70, y);
      doc.text('Amount', 140, y, { align: 'right' });
      doc.text('Note', 150, y);
      y += 4;
      doc.line(14, y, 200, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      lenderPayments.forEach((payment) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        const borrower = borrowers.find(b => b.id === payment.borrower_id);
        const typeDisplay = payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1);

        doc.text(payment.payment_date, 14, y);
        doc.text(typeDisplay, 38, y);
        doc.text((borrower?.name || 'General').slice(0, 15), 70, y);
        doc.text(currency(Number(payment.amount)), 140, y, { align: 'right' });
        doc.text((payment.note || '').slice(0, 25), 150, y);
        y += 5;
      });
    }

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This comprehensive balance sheet includes all historical transactions and lender payments.', 14, y);
    y += 4;
    doc.text('For questions, please contact Curated Capital Group.', 14, y);

    const fileName = `facility_balance_sheet_${facility.name.replace(/\s+/g, '_')}_${statementDate}.pdf`;
    doc.save(fileName);
  };

  const exportToCSV = () => {
    if (!facility) return;

    const allTxs = transactions
      .filter((t) => facilityLoanIds.includes(t.loan_id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows: string[] = [];
    rows.push('Type,Date,Borrower,Loan,Facility,Transaction Type,Amount,Note');

    allTxs.forEach((tx) => {
      const loan = loans.find(l => l.id === tx.loan_id);
      const borrower = borrowers.find(b => b.id === loan?.borrower_id);
      const row = [
        'Borrower Transaction',
        tx.date,
        `"${borrower?.name || 'Unknown'}"`,
        `"${loan?.loan_name || loan?.id.slice(0, 8) || ''}"`,
        `"${facility.name}"`,
        tx.type,
        Number(tx.amount).toFixed(2),
        `"${(tx.note || '').replace(/"/g, '""')}"`
      ].join(',');
      rows.push(row);
    });

    lenderPayments.forEach((payment) => {
      const borrower = borrowers.find(b => b.id === payment.borrower_id);
      const row = [
        'Payment to Lender',
        payment.payment_date,
        `"${borrower?.name || 'General'}"`,
        '',
        `"${facility.name}"`,
        `payment_${payment.payment_type}`,
        Number(payment.amount).toFixed(2),
        `"${(payment.note || '').replace(/"/g, '""')}"`
      ].join(',');
      rows.push(row);
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `facility_data_${facility.name.replace(/\s+/g, '_')}_${todayISO()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalUtilization = loans.reduce((sum, loan) => sum + loanBalance(loan.id), 0);
  const totalInterestFeesDue = loans.reduce((sum, loan) => sum + interestAndFeesDue(loan.id), 0);
  const availableCapacity = Number(facility?.facility_limit || 0) - totalUtilization;
  const utilizationPct = Number(facility?.facility_limit || 0) > 0
    ? (totalUtilization / Number(facility?.facility_limit || 0)) * 100
    : 0;

  // Calculate payments to lender
  const facilityLoanIds = loans.map(l => l.id);
  const totalInterestPayments = transactions
    .filter((t) => facilityLoanIds.includes(t.loan_id) && t.type === 'interest_payment')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalPrincipalRepayments = transactions
    .filter((t) => facilityLoanIds.includes(t.loan_id) && t.type === 'repayment')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalFeePayments = transactions
    .filter((t) => facilityLoanIds.includes(t.loan_id) && t.type === 'fee_payment')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalPaymentsToLender = totalInterestPayments + totalPrincipalRepayments + totalFeePayments;

  if (loading) {
    return <div className="p-8 text-center">Loading facility...</div>;
  }

  if (!facility) {
    return <div className="p-8 text-center">Facility not found</div>;
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
            <h1 className="text-lg font-semibold text-center">Facility — {facility.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="solid" onClick={generateComprehensiveBalanceSheet}>
              Download Balance Sheet (PDF)
            </Button>
            <Button variant="solid" onClick={exportToCSV}>
              Export to Excel (CSV)
            </Button>
            <Button variant="outline" onClick={generateFacilityStatement}>
              Download Statement
            </Button>
            <Button variant="outline" onClick={onBack}>
              ← Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Section title="Facility Overview">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Facility Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facility Name:</span>
                  <span className="font-medium">{facility.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lender:</span>
                  <span className="font-medium">{facility.lender_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge tone={facility.status === 'active' ? 'green' : 'gray'}>
                    {facility.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interest Rate Floor:</span>
                  <span className="font-medium">{Number(facility.interest_rate_floor).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origination Fee:</span>
                  <span className="font-medium">{Number(facility.origination_fee_pct).toFixed(2)}%</span>
                </div>
                {facility.note && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Notes:</span>
                    <p className="mt-1 text-gray-800">{facility.note}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Capacity & Utilization</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facility Limit:</span>
                  <span className="font-semibold text-lg">{currency(Number(facility.facility_limit))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Utilization:</span>
                  <span className="font-semibold text-lg text-blue-600">{currency(totalUtilization)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Capacity:</span>
                  <span className="font-semibold text-lg text-green-600">{currency(availableCapacity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Utilization %:</span>
                  <span className="font-medium">{utilizationPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Interest & Fees Due:</span>
                  <span className="font-semibold text-lg text-red-600">{currency(totalInterestFeesDue)}</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        utilizationPct > 90 ? 'bg-red-500' :
                        utilizationPct > 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Active Loans:</span>
                  <span className="font-medium">{loans.filter(l => l.status === 'active').length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payments to Lender (All Time)</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <span className="text-gray-600 text-xs">Interest Payments</span>
                <div className="font-semibold text-lg text-blue-700 mt-1">{currency(totalInterestPayments)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <span className="text-gray-600 text-xs">Principal Repayments</span>
                <div className="font-semibold text-lg text-green-700 mt-1">{currency(totalPrincipalRepayments)}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <span className="text-gray-600 text-xs">Fee Payments</span>
                <div className="font-semibold text-lg text-amber-700 mt-1">{currency(totalFeePayments)}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-300">
                <span className="text-gray-600 text-xs">Total Payments</span>
                <div className="font-semibold text-lg text-slate-800 mt-1">{currency(totalPaymentsToLender)}</div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Loans in this Facility" collapsible defaultOpen={true}>
          {loans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No loans assigned to this facility yet.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Loan Name</th>
                    <th className="p-3 text-left">Borrower</th>
                    <th className="p-3 text-right">Principal Balance</th>
                    <th className="p-3 text-right">APR</th>
                    <th className="p-3 text-left">Rate Type</th>
                    <th className="p-3 text-left">Start Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const borrower = borrowers.find((b) => b.id === loan.borrower_id);
                    const balance = loanBalance(loan.id);
                    const apr = currentAPR(loan);

                    return (
                      <tr key={loan.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{loan.loan_name || `Loan ${loan.id.slice(0, 8)}`}</td>
                        <td className="p-3">{borrower?.name || 'Unknown'}</td>
                        <td className="p-3 text-right font-semibold">{currency(balance)}</td>
                        <td className="p-3 text-right">{apr.toFixed(2)}%</td>
                        <td className="p-3 capitalize">{loan.rate_type}</td>
                        <td className="p-3">{loan.start_date}</td>
                        <td className="p-3">
                          <Badge tone={loan.status === 'active' ? 'green' : 'gray'}>
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="solid"
                            onClick={() => onViewLoan(loan.borrower_id)}
                          >
                            View Loan
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Borrowers in this Facility" collapsible>
          {(() => {
            const uniqueBorrowerIds = [...new Set(loans.map(l => l.borrower_id))];
            const facilityBorrowers = borrowers.filter(b => uniqueBorrowerIds.includes(b.id));

            if (facilityBorrowers.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No borrowers in this facility yet.
                </div>
              );
            }

            return (
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Borrower Name</th>
                      <th className="p-3 text-right">Total Loans</th>
                      <th className="p-3 text-right">Total Outstanding</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilityBorrowers.map((borrower) => {
                      const borrowerLoans = loans.filter(l => l.borrower_id === borrower.id);
                      const totalOutstanding = borrowerLoans.reduce((sum, l) => sum + loanBalance(l.id), 0);

                      return (
                        <tr key={borrower.id} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{borrower.name}</td>
                          <td className="p-3 text-right">{borrowerLoans.length}</td>
                          <td className="p-3 text-right font-semibold">{currency(totalOutstanding)}</td>
                          <td className="p-3 text-right">
                            <Button
                              variant="solid"
                              onClick={() => onViewBorrower(borrower.id)}
                            >
                              View Borrower
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Section>

        <Section title="Facility Balance Sheet & All Transactions" collapsible defaultOpen={true}>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Advanced (Principal)</div>
              <div className="text-2xl font-bold text-blue-600">
                {currency(
                  transactions
                    .filter((t) => facilityLoanIds.includes(t.loan_id) && t.type === 'advance')
                    .reduce((s, t) => s + Number(t.amount), 0)
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Collected</div>
              <div className="text-2xl font-bold text-green-600">
                {currency(
                  transactions
                    .filter((t) => facilityLoanIds.includes(t.loan_id) &&
                      ['repayment', 'interest_payment', 'fee_payment'].includes(t.type))
                    .reduce((s, t) => s + Number(t.amount), 0)
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Principal: {currency(totalPrincipalRepayments)} |
                Interest: {currency(totalInterestPayments)} |
                Fees: {currency(totalFeePayments)}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Outstanding Receivables</div>
              <div className="text-2xl font-bold text-red-600">
                {currency(totalUtilization + totalInterestFeesDue)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Principal: {currency(totalUtilization)} |
                Int. & Fees Due: {currency(totalInterestFeesDue)}
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <strong>All Loan Transactions:</strong> Complete transaction history for all loans in this facility, including advances, repayments, interest due, interest payments, fees, and fee payments.
          </div>

          {(() => {
            const allLoanTransactions = transactions
              .filter((t) => facilityLoanIds.includes(t.loan_id))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (allLoanTransactions.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No transactions recorded yet.
                </div>
              );
            }

            return (
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Loan</th>
                      <th className="p-3 text-left">Borrower</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLoanTransactions.map((tx) => {
                      const loan = loans.find((l) => l.id === tx.loan_id);
                      const borrower = borrowers.find((b) => b.id === loan?.borrower_id);
                      const isDebit = ['advance', 'interest', 'interest_due', 'fee'].includes(tx.type);
                      const isCredit = ['repayment', 'interest_payment', 'fee_payment'].includes(tx.type);

                      return (
                        <tr key={tx.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{tx.date}</td>
                          <td className="p-3 text-xs text-gray-600">
                            {loan?.loan_name || loan?.id.slice(0, 8) || '—'}
                          </td>
                          <td className="p-3">{borrower?.name || '—'}</td>
                          <td className="p-3">
                            <Badge tone={
                              tx.type === 'advance' ? 'blue' :
                              tx.type === 'repayment' ? 'green' :
                              tx.type === 'interest_due' ? 'red' :
                              tx.type === 'interest_payment' ? 'green' :
                              tx.type === 'fee' ? 'red' :
                              tx.type === 'fee_payment' ? 'green' :
                              'gray'
                            }>
                              {tx.type === 'interest_due' ? 'Interest Due' :
                               tx.type === 'interest_payment' ? 'Interest Paid' :
                               tx.type === 'fee_payment' ? 'Fee Paid' :
                               tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </Badge>
                          </td>
                          <td className={`p-3 text-right font-semibold ${isDebit ? 'text-red-600' : isCredit ? 'text-green-600' : ''}`}>
                            {isDebit ? '+' : isCredit ? '-' : ''}{currency(Number(tx.amount))}
                          </td>
                          <td className="p-3 text-gray-600 text-xs">{tx.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Section>

        <Section title="Facility Transactions" collapsible defaultOpen={false}>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Note:</strong> Facility transactions are automatically created from loan transactions (advances, repayments, interest payments, fee payments). Manual facility-level transactions can also be added below.
          </div>

          {/* <div className="mb-4">
            <FacilityTransactionForm facilityId={facilityId} onSuccess={loadData} />
          </div> */}

          {facilityTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Note</th>
                    <th className="p-3 text-center">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{tx.date}</td>
                      <td className="p-3 capitalize">
                        <Badge tone={
                          tx.type === 'draw' ? 'blue' :
                          tx.type === 'repayment' || tx.type === 'paydown' ? 'green' :
                          'gray'
                        }>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {tx.type === 'draw' || tx.type === 'fee' ? '+' : '-'}{currency(Number(tx.amount))}
                      </td>
                      <td className="p-3 text-gray-600">{tx.note || '—'}</td>
                      <td className="p-3 text-center">
                        {tx.loan_transaction_id ? (
                          <Badge tone="green">Auto</Badge>
                        ) : (
                          <Badge tone="gray">Manual</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* <Section title="Payments to Lender" collapsible defaultOpen={true}>
          <LenderPaymentForm
            facilityId={facilityId}
            borrowers={borrowers.filter(b => loans.some(l => l.borrower_id === b.id))}
            onSuccess={loadData}
          />

          <div className="mt-6">
            {lenderPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payments to lender recorded yet.
              </div>
            ) : (
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Borrower</th>
                      <th className="p-3 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lenderPayments.map((payment) => {
                      const borrower = borrowers.find(b => b.id === payment.borrower_id);
                      return (
                        <tr key={payment.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{payment.payment_date}</td>
                          <td className="p-3">
                            <Badge tone={
                              payment.payment_type === 'interest' ? 'green' :
                              payment.payment_type === 'principal' ? 'blue' :
                              'gray'
                            }>
                              {payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-semibold">{currency(Number(payment.amount))}</td>
                          <td className="p-3">{borrower?.name || 'General'}</td>
                          <td className="p-3 text-gray-600 text-xs">{payment.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="p-3 font-bold text-right">Total Paid to Lender:</td>
                      <td className="p-3 text-right font-bold text-lg">
                        {currency(lenderPayments.reduce((s, p) => s + Number(p.amount), 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </Section> */}

        <Section title="Loan Transfer History" collapsible defaultOpen={false}>
          {loanTransfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No loan transfers recorded yet.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Loan (Borrower)</th>
                    <th className="p-3 text-left">From Facility</th>
                    <th className="p-3 text-left">To Facility</th>
                    <th className="p-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {loanTransfers.map((transfer) => {
                    const loan = loans.find(l => l.id === transfer.loan_id);
                    const borrower = loan ? borrowers.find(b => b.id === loan.borrower_id) : null;

                    return (
                      <tr key={transfer.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{transfer.transfer_date}</td>
                        <td className="p-3 font-medium">{borrower?.name || 'Unknown Borrower'}</td>
                        <td className="p-3">
                          {transfer.from_facility_id === facilityId ? (
                            <Badge tone="red">This Facility</Badge>
                          ) : (
                            <span className="text-gray-600">Other Facility</span>
                          )}
                        </td>
                        <td className="p-3">
                          {transfer.to_facility_id === facilityId ? (
                            <Badge tone="green">This Facility</Badge>
                          ) : (
                            <span className="text-gray-600">Other Facility</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-600">{transfer.note || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Facility History" collapsible defaultOpen={false}>
          {facilityHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No facility history recorded yet.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Event Type</th>
                    <th className="p-3 text-right">Previous Limit</th>
                    <th className="p-3 text-right">New Limit</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityHistory.map((history) => (
                    <tr key={history.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{history.change_date}</td>
                      <td className="p-3">
                        <Badge tone={
                          history.change_type === 'limit_increase' ? 'green' :
                          history.change_type === 'limit_decrease' ? 'red' :
                          history.change_type === 'paydown' ? 'blue' :
                          'gray'
                        }>
                          {history.change_type === 'limit_increase' ? 'Limit Increase' :
                           history.change_type === 'limit_decrease' ? 'Limit Decrease' :
                           history.change_type === 'paydown' ? 'Facility Paydown' :
                           'Created'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {history.previous_limit !== null ? currency(Number(history.previous_limit)) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {history.new_limit !== null ? currency(Number(history.new_limit)) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {history.amount !== null ? currency(Number(history.amount)) : '—'}
                      </td>
                      <td className="p-3 text-gray-600">{history.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </main>
    </div>
  );
};
