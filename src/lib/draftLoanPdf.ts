/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import jsPDF from 'jspdf';
import type { Loan, Borrower, Artwork } from '../types';
import { usdStr, pctLabel } from './money';

interface DraftLoanData {
  loan: Loan;
  borrower: Borrower;
  artworks: Artwork[];
  totalAppraisedValue: number;
}

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);
};

const addFooter = (doc: jsPDF, pageNum: number) => {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Page ${pageNum}`, 105, 285, { align: 'center' });
  doc.text('DRAFT - For Review Only', 105, 290, { align: 'center' });
};

export const generateArtworkValuationPDF = (data: DraftLoanData) => {
  const doc = new jsPDF();
  const { borrower, artworks, totalAppraisedValue } = data;

  addHeader(doc, 'Artwork Valuation Summary');

  let y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Artwork Collateral', 20, y);

  y += 10;
  artworks.forEach((artwork, index) => {
    if (y > 250) {
      addFooter(doc, 1);
      doc.addPage();
      addHeader(doc, 'Artwork Valuation Summary');
      y = 45;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${artwork.title}`, 20, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Artist: ${artwork.artist}`, 25, y);

    if (artwork.dimensions) {
      y += 6;
      doc.text(`Dimensions: ${artwork.dimensions}`, 25, y);
    }

    if (artwork.materials) {
      y += 6;
      doc.text(`Materials: ${artwork.materials}`, 25, y);
    }

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Appraised Value: ${Number(artwork.appraised_value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 25, y);
    doc.setFont('helvetica', 'normal');

    if (artwork.appraisal_date) {
      y += 6;
      doc.text(`Appraisal Date: ${new Date(artwork.appraisal_date).toLocaleDateString()}`, 25, y);
    }

    if (artwork.location) {
      y += 6;
      doc.text(`Location: ${artwork.location}`, 25, y);
    }

    y += 10;
  });

  y += 5;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Appraised Value: ${Number(totalAppraisedValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 20, y);

  addFooter(doc, 1);

  return doc;
};

export async function generateLoanTermsPDF(
  loan: Loan,
  borrower: Borrower,
  artworks: Artwork[],
  prepaidInterestCents: number,
  originationFeeCents: number,
  totalDeductionsCents: number,
  netFundingCents: number
): Promise<jsPDF> {
  // TODO: Implementation pending
  throw new Error('generateLoanTermsPDF not implemented');
}

export const generateFundingStatementPDF = (data: DraftLoanData) => {
  const doc = new jsPDF();
  const { loan, borrower } = data;

  addHeader(doc, 'Funding Statement');

  let y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Funding Breakdown', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const principalCents = loan.principal_cents;
  const originationFeeCents = Math.round(principalCents * (loan.origination_fee_bps / 10000));
  const prepaidInterestCents = loan.prepaid_interest_months
    ? Math.round(principalCents * (loan.interest_rate_bps / 10000 / 12) * loan.prepaid_interest_months)
    : 0;
  const prepaidFeesCents = loan.prepaid_fees_cents || 0;

  doc.text('Principal (45% LTV):', 20, y);
  doc.text(usdStr(principalCents), 120, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Less: Deductions at Closing', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (prepaidInterestCents > 0) {
    doc.text(`Prepaid Interest (${loan.prepaid_interest_months} month${loan.prepaid_interest_months > 1 ? 's' : ''} @ ${(loan.interest_rate_bps / 100).toFixed(2)}%):`, 20, y);
    doc.text(usdStr(prepaidInterestCents), 120, y);
    y += 6;
  }

  if (prepaidFeesCents > 0) {
    doc.text('Prepaid Fees:', 20, y);
    doc.text(usdStr(prepaidFeesCents), 120, y);
    y += 6;
  }

  doc.text(`Origination Fee (${(loan.origination_fee_bps / 100).toFixed(2)}%):`, 20, y);
  doc.text(usdStr(originationFeeCents), 120, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const totalDeductionsCents = originationFeeCents + prepaidInterestCents + prepaidFeesCents;
  doc.text('Total Deductions:', 20, y);
  doc.text(usdStr(totalDeductionsCents), 120, y);

  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  const netFundingCents = principalCents - totalDeductionsCents;
  doc.text('Net Funding to Borrower:', 20, y);
  doc.text(usdStr(netFundingCents), 120, y);

  y += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Net funding represents the actual cash disbursed to the', 20, y);
  y += 6;
  doc.text('borrower after deducting all closing fees and prepaid items.', 20, y);

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Repayment Summary', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Principal to Repay:', 20, y);
  doc.text(usdStr(principalCents), 120, y);

  y += 6;
  doc.text('Interest Rate:', 20, y);
  doc.text(`${(loan.interest_rate_bps / 100).toFixed(2)}% APR`, 120, y);

  y += 6;
  doc.text('Interest Frequency:', 20, y);
  const freq = loan.interest_frequency === 'monthly' ? 'Monthly' : 'Quarterly';
  doc.text(freq, 120, y);

  addFooter(doc, 1);

  return doc;
};

export const generateCombinedLoanPackagePDF = (data: DraftLoanData) => {
  const { loan, borrower, artworks, totalAppraisedValue } = data;
  const doc = new jsPDF();

  addHeader(doc, 'Loan Package - Complete Overview');

  let y = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Loan Terms Statement', 25, y);
  y += 6;
  doc.text('2. Funding Statement', 25, y);
  y += 6;
  doc.text('3. Artwork Valuation Summary', 25, y);

  addFooter(doc, 1);

  // Page 2: Loan Terms
  doc.addPage();
  addHeader(doc, 'Loan Terms Statement');

  y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Details', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (loan.loan_name) {
    doc.text(`Loan Name: ${loan.loan_name}`, 20, y);
    y += 6;
  }

  doc.text(`Loan ID: ${loan.id}`, 20, y);
  y += 6;
  doc.text(`Status: ${loan.status}`, 20, y);

  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Terms', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Total Collateral Value: ${Number(totalAppraisedValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 20, y);
  y += 6;
  doc.text(`Loan-to-Value (LTV): ${pctLabel(loan.ltv_pct)}`, 20, y);
  y += 6;
  doc.text(`Principal Amount: ${usdStr(loan.principal_cents)}`, 20, y);
  y += 6;
  doc.text(`Interest Rate: ${(loan.interest_rate_bps / 100).toFixed(2)}% APR (${loan.interest_rate_bps} basis points)`, 20, y);
  y += 6;

  const originationFeeCents = Math.round(loan.principal_cents * (loan.origination_fee_bps / 10000));
  doc.text(`Origination Fee: ${(loan.origination_fee_bps / 100).toFixed(2)}% = ${usdStr(originationFeeCents)}`, 20, y);

  addFooter(doc, 2);

  // Page 3: Funding Statement
  doc.addPage();
  addHeader(doc, 'Funding Statement');

  y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Funding Breakdown', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const principalCents = loan.principal_cents;
  const prepaidInterestCents = loan.prepaid_interest_months
    ? Math.round(principalCents * (loan.interest_rate_bps / 10000 / 12) * loan.prepaid_interest_months)
    : 0;
  const prepaidFeesCents = loan.prepaid_fees_cents || 0;

  doc.text('Principal (45% LTV):', 20, y);
  doc.text(usdStr(principalCents), 120, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Less: Deductions at Closing', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (prepaidInterestCents > 0) {
    doc.text(`Prepaid Interest (${loan.prepaid_interest_months} month${loan.prepaid_interest_months > 1 ? 's' : ''} @ ${(loan.interest_rate_bps / 100).toFixed(2)}%):`, 20, y);
    doc.text(usdStr(prepaidInterestCents), 120, y);
    y += 6;
  }

  if (prepaidFeesCents > 0) {
    doc.text('Prepaid Fees:', 20, y);
    doc.text(usdStr(prepaidFeesCents), 120, y);
    y += 6;
  }

  doc.text(`Origination Fee (${(loan.origination_fee_bps / 100).toFixed(2)}%):`, 20, y);
  doc.text(usdStr(originationFeeCents), 120, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const totalDeductionsCents = originationFeeCents + prepaidInterestCents + prepaidFeesCents;
  doc.text('Total Deductions:', 20, y);
  doc.text(usdStr(totalDeductionsCents), 120, y);

  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  const netFundingCents = principalCents - totalDeductionsCents;
  doc.text('Net Funding to Borrower:', 20, y);
  doc.text(usdStr(netFundingCents), 120, y);

  addFooter(doc, 3);

  // Page 4+: Artwork Valuation
  doc.addPage();
  addHeader(doc, 'Artwork Valuation Summary');

  y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Collateral Artworks', 20, y);

  y += 10;
  artworks.forEach((artwork, index) => {
    if (y > 250) {
      doc.addPage();
      y = 40;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${artwork.artist} - ${artwork.title}`, 20, y);

    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Appraised Value: ${Number(artwork.appraised_value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 25, y);

    if (artwork.year) {
      y += 6;
      doc.text(`Year: ${artwork.year}`, 25, y);
    }

    if (artwork.medium) {
      y += 6;
      doc.text(`Medium: ${artwork.medium}`, 25, y);
    }

    y += 10;
  });

  y += 5;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Appraised Value: ${Number(totalAppraisedValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 20, y);

  const currentPage = doc.internal.pages.length - 1;
  addFooter(doc, currentPage);

  return doc;
};

export const generateLenderIncomeStatementPDF = (data: DraftLoanData) => {
  const doc = new jsPDF();
  const { loan, borrower, totalAppraisedValue } = data;
  const PAGE_MARGIN_BOTTOM = 270;
  let currentPage = 1;

  const checkPageBreak = (neededSpace: number): number => {
    if (y + neededSpace > PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      currentPage++;
      addHeader(doc, 'Lender Income Statement - Internal Use Only');
      addFooter(doc, currentPage);
      return 45;
    }
    return y;
  };

  addHeader(doc, 'Lender Income Statement - Internal Use Only');

  let y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Overview', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Borrower: ${borrower.name}`, 20, y);

  y += 6;
  if (loan.loan_name) {
    doc.text(`Loan Name: ${loan.loan_name}`, 20, y);
    y += 6;
  }
  doc.text(`Loan ID: ${loan.id}`, 20, y);

  y += 15;
  y = checkPageBreak(50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Terms', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const principalCents = loan.principal_cents;
  const originationFeeCents = Math.round(principalCents * (loan.origination_fee_bps / 10000));
  const prepaidInterestCents = loan.prepaid_interest_months
    ? Math.round(principalCents * (loan.interest_rate_bps / 10000 / 12) * loan.prepaid_interest_months)
    : 0;
  const prepaidFeesCents = loan.prepaid_fees_cents || 0;

  doc.text(`Total Collateral Value: ${Number(totalAppraisedValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 20, y);
  y += 6;
  doc.text(`Loan-to-Value (LTV): ${pctLabel(loan.ltv_pct)}`, 20, y);
  y += 6;
  doc.text(`Principal Amount: ${usdStr(principalCents)}`, 20, y);
  y += 6;
  doc.text(`Interest Rate: ${(loan.interest_rate_bps / 100).toFixed(2)}% APR`, 20, y);
  y += 6;
  doc.text(`Interest Frequency: ${loan.interest_frequency === 'monthly' ? 'Monthly' : 'Quarterly'}`, 20, y);

  y += 15;
  y = checkPageBreak(60);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Projected Income Summary', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('One-Time Income (At Closing):', 20, y);
  y += 8;
  doc.text(`  Origination Fee (${(loan.origination_fee_bps / 100).toFixed(2)}%):`, 20, y);
  doc.text(usdStr(originationFeeCents), 120, y);

  if (prepaidInterestCents > 0) {
    y += 6;
    doc.text(`  Prepaid Interest (${loan.prepaid_interest_months} month${loan.prepaid_interest_months > 1 ? 's' : ''}):`, 20, y);
    doc.text(usdStr(prepaidInterestCents), 120, y);
  }

  if (prepaidFeesCents > 0) {
    y += 6;
    doc.text('  Prepaid Fees:', 20, y);
    doc.text(usdStr(prepaidFeesCents), 120, y);
  }

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  const totalClosingIncomeCents = originationFeeCents + prepaidInterestCents + prepaidFeesCents;
  doc.text('Total Closing Income:', 20, y);
  doc.text(usdStr(totalClosingIncomeCents), 120, y);

  y += 15;
  y = checkPageBreak(30);

  doc.setFont('helvetica', 'normal');
  doc.text('Recurring Income:', 20, y);

  y += 8;
  const frequency = loan.interest_frequency === 'monthly' ? 'Monthly' : 'Quarterly';
  const periodsPerYear = loan.interest_frequency === 'monthly' ? 12 : 4;
  const interestPerPeriodCents = Math.round(principalCents * (loan.interest_rate_bps / 10000) / periodsPerYear);

  doc.text(`  ${frequency} Interest Payment:`, 20, y);
  doc.text(usdStr(interestPerPeriodCents), 120, y);

  y += 6;
  const annualInterestCents = Math.round(principalCents * (loan.interest_rate_bps / 10000));
  doc.text('  Annual Interest (estimated):',20, y);
  doc.text(usdStr(annualInterestCents), 120, y);

  y += 15;
  y = checkPageBreak(70);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Income Breakdown', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Year 1 Projected Income:', 20, y);
  y += 6;
  const year1IncomeCents = totalClosingIncomeCents + annualInterestCents - prepaidInterestCents;
  doc.text(`  Closing Income: ${usdStr(totalClosingIncomeCents)}`, 25, y);
  y += 6;
  const adjustedYear1InterestCents = annualInterestCents - prepaidInterestCents;
  doc.text(`  Interest Income (remaining ${12 - (loan.prepaid_interest_months || 0)} months): ${usdStr(adjustedYear1InterestCents)}`, 25, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(25, y, 190, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`  Year 1 Total: ${usdStr(year1IncomeCents)}`, 25, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.text('Subsequent Years (Annual):', 20, y);
  y += 6;
  doc.text(`  Interest Income: ${usdStr(annualInterestCents)}`, 25, y);

  y += 15;
  y = checkPageBreak(50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Capital Deployment', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const netFundingCents = principalCents - totalClosingIncomeCents;
  doc.text('Net Capital Required:', 20, y);
  doc.text(usdStr(netFundingCents), 120, y);

  y += 6;
  const principalStr = usdStr(principalCents);
  const closingIncomeStr = usdStr(totalClosingIncomeCents);
  doc.text(`(Principal ${principalStr} - Closing Income ${closingIncomeStr})`, 20, y);

  y += 10;
  const effectiveYield1Pct = netFundingCents > 0 ? (year1IncomeCents / netFundingCents) * 100 : 0;
  doc.text(`Year 1 Return on Capital: ${effectiveYield1Pct.toFixed(2)}%`, 20, y);

  y += 6;
  const ongoingYieldPct = netFundingCents > 0 ? (annualInterestCents / netFundingCents) * 100 : 0;
  doc.text(`Ongoing Annual Return: ${ongoingYieldPct.toFixed(2)}%`, 20, y);

  addFooter(doc, currentPage);

  return doc;
};

interface ProceedsData {
  borrower: Borrower;
  projectedFunding: number;
  originationFee: number;
  prepaidInterest: number;
  prepaidFees: number;
  netProceeds: number;
  principal: number;
  interestRate: number;
  ltvPct: number;
  totalAppraisedValue: number;
}

export const generateProceedsSchedulePDF = (data: ProceedsData) => {
  const doc = new jsPDF();
  const {
    borrower,
    projectedFunding,
    originationFee,
    prepaidInterest,
    prepaidFees,
    netProceeds,
    principal,
    interestRate,
    ltvPct,
    totalAppraisedValue
  } = data;

  addHeader(doc, 'Proceeds Schedule');

  let y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${borrower.name}`, 20, y);
  if (borrower.contact) {
    y += 6;
    doc.text(`Contact: ${borrower.contact}`, 20, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Summary', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Total Collateral Value: ${usdStr(totalAppraisedValue)}`, 20, y);
  y += 6;
  doc.text(`Loan-to-Value Ratio: ${ltvPct.toFixed(2)}%`, 20, y);
  y += 6;
  doc.text(`Interest Rate: ${(interestRate / 100).toFixed(2)}% APR`, 20, y);

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Proceeds Breakdown', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Loan Principal:', 20, y);
  doc.text(usdStr(principal), 120, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Less: Deductions at Closing', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (originationFee > 0) {
    doc.text('Origination Fee:', 20, y);
    doc.text(usdStr(originationFee), 120, y);
    y += 6;
  }

  if (prepaidInterest > 0) {
    doc.text('Prepaid Interest:', 20, y);
    doc.text(usdStr(prepaidInterest), 120, y);
    y += 6;
  }

  if (prepaidFees > 0) {
    doc.text('Prepaid Fees:', 20, y);
    doc.text(usdStr(prepaidFees), 120, y);
    y += 6;
  }

  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 190, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  const totalDeductions = originationFee + prepaidInterest + prepaidFees;
  doc.text('Total Deductions:', 20, y);
  doc.text(usdStr(totalDeductions), 120, y);

  y += 2;
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFontSize(12);
  doc.text('Net Proceeds to Borrower:', 20, y);
  doc.text(usdStr(netProceeds), 120, y);

  y += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Net proceeds represent the actual funds that will be disbursed to the borrower', 20, y);
  y += 5;
  doc.text('after deducting all fees and prepaid amounts at loan closing.', 20, y);

  addFooter(doc, 1);

  return doc;
};
