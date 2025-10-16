import { supabase } from './supabase';
import type { Loan, Borrower, Transaction, Artwork } from '../types';

interface StatementData {
  loan: Loan;
  borrower: Borrower;
  transactions: Transaction[];
  artworks: Artwork[];
  balance: number;
  apr: number;
  ltv: number;
  accruedInterest: number;
}

export const sendStatementEmail = async (
  borrowerEmail: string,
  statementData: StatementData,
  type: 'monthly_statement' | 'interest_invoice'
) => {
  const { loan, borrower } = statementData;

  const subject = type === 'monthly_statement'
    ? `Monthly Statement - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : `Interest Invoice - ${loan.id.slice(0, 8)}`;

  const html = type === 'monthly_statement'
    ? generateStatementHTML(statementData)
    : generateInvoiceHTML(statementData);

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-statement-email`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: borrowerEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    await supabase.from('statement_deliveries').insert([{
      loan_id: loan.id,
      borrower_id: borrower.id,
      delivery_type: type,
      email: borrowerEmail,
      status: 'sent',
    }]);

    return { success: true };
  } catch (error) {
    await supabase.from('statement_deliveries').insert([{
      loan_id: loan.id,
      borrower_id: borrower.id,
      delivery_type: type,
      email: borrowerEmail,
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error),
    }]);

    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

const generateStatementHTML = (data: StatementData): string => {
  const { loan, borrower, transactions, balance, apr, ltv, accruedInterest } = data;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #E63946; padding-bottom: 20px; margin-bottom: 30px; }
        .header img { width: 120px; height: 120px; margin: 0 auto 15px; }
        .header h1 { color: #000; margin: 10px 0 5px 0; font-size: 28px; font-weight: 900; }
        .header .subtitle { color: #000; font-size: 14px; letter-spacing: 3px; margin-bottom: 15px; }
        .header p { color: #666; margin: 10px 0 0 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #E63946; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
        .info-label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .amount { text-align: right; }
        .highlight { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <svg width="120" height="120" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="280" stroke="#E63946" stroke-width="3" fill="none" stroke-dasharray="700 100"/>
          <text x="400" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="900" fill="#000000" text-anchor="middle">CURATED.</text>
          <text x="400" y="440" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="#000000" text-anchor="middle" letter-spacing="8">CAPITAL GROUP</text>
        </svg>
        <p>Monthly Loan Statement</p>
      </div>

      <div class="section">
        <h2>Statement Information</h2>
        <div class="info-grid">
          <div class="info-label">Statement Date:</div>
          <div>${today}</div>
          <div class="info-label">Borrower:</div>
          <div>${borrower.name}</div>
          <div class="info-label">Loan ID:</div>
          <div>${loan.id.slice(0, 8)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Loan Summary</h2>
        <div class="info-grid">
          <div class="info-label">Principal Balance:</div>
          <div>$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="info-label">Annual Percentage Rate:</div>
          <div>${apr.toFixed(2)}%</div>
          <div class="info-label">Loan-to-Value Ratio:</div>
          <div>${ltv.toFixed(2)}%</div>
          <div class="info-label">Rate Type:</div>
          <div>${loan.rate_type === 'fixed' ? 'Fixed' : 'Floating'}</div>
          <div class="info-label">Interest Frequency:</div>
          <div>${loan.interest_frequency === 'monthly' ? 'Monthly' : 'Quarterly'}</div>
        </div>
      </div>

      <div class="section">
        <h2>Recent Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th class="amount">Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 10).map(t => {
              const typeDisplay = t.type === 'interest_due' ? 'Interest Due' :
                                  t.type === 'interest_payment' ? 'Interest Payment' :
                                  t.type === 'fee_payment' ? 'Fee Payment' :
                                  t.type.charAt(0).toUpperCase() + t.type.slice(1);
              return `
              <tr>
                <td>${t.date}</td>
                <td>${typeDisplay}</td>
                <td class="amount">$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${t.note || '—'}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="highlight">
        <strong>Accrued Interest (not yet posted):</strong> $${accruedInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div class="footer">
        <p>Curated Capital Group<br>
        This is an automated statement. Please retain for your records.</p>
      </div>
    </body>
    </html>
  `;
};

const generateInvoiceHTML = (data: StatementData): string => {
  const { loan, borrower, balance, apr, accruedInterest } = data;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #E63946; padding-bottom: 20px; margin-bottom: 30px; }
        .header img { width: 120px; height: 120px; margin: 0 auto 15px; }
        .header h1 { color: #000; margin: 10px 0 5px 0; font-size: 28px; font-weight: 900; }
        .header p { color: #666; margin: 10px 0 0 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #E63946; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
        .info-label { font-weight: bold; }
        .amount-due { background-color: #fee2e2; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }
        .amount-due h3 { margin: 0 0 10px 0; color: #991b1b; }
        .amount-due .amount { font-size: 32px; font-weight: bold; color: #E63946; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <svg width="120" height="120" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="280" stroke="#E63946" stroke-width="3" fill="none" stroke-dasharray="700 100"/>
          <text x="400" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="900" fill="#000000" text-anchor="middle">CURATED.</text>
          <text x="400" y="440" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="#000000" text-anchor="middle" letter-spacing="8">CAPITAL GROUP</text>
        </svg>
        <p>Interest Invoice</p>
      </div>

      <div class="section">
        <h2>Invoice Details</h2>
        <div class="info-grid">
          <div class="info-label">Invoice Date:</div>
          <div>${today}</div>
          <div class="info-label">Borrower:</div>
          <div>${borrower.name}</div>
          <div class="info-label">Loan ID:</div>
          <div>${loan.id.slice(0, 8)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Interest Calculation</h2>
        <div class="info-grid">
          <div class="info-label">Principal Balance:</div>
          <div>$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="info-label">Annual Percentage Rate:</div>
          <div>${apr.toFixed(2)}%</div>
          <div class="info-label">Rate Type:</div>
          <div>${loan.rate_type === 'fixed' ? 'Fixed' : 'Floating'}</div>
          <div class="info-label">Interest Frequency:</div>
          <div>${loan.interest_frequency === 'monthly' ? 'Monthly' : 'Quarterly'}</div>
        </div>
      </div>

      <div class="amount-due">
        <h3>AMOUNT DUE</h3>
        <div class="amount">$${accruedInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div class="footer">
        <p>Curated Capital Group<br>
        Please remit payment promptly. This invoice reflects accrued interest as of the invoice date.</p>
      </div>
    </body>
    </html>
  `;
};
