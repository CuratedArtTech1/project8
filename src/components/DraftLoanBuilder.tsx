import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toUSD, usdStr, fromUSD, pctLabel, bpsToDecimal } from '../lib/money';
import {
  generateArtworkValuationPDF,
  generateLoanTermsPDF,
  generateFundingStatementPDF,
  generateCombinedLoanPackagePDF,
  generateLenderIncomeStatementPDF,
  generateProceedsSchedulePDF
} from '../lib/draftLoanPdf';
import type { Borrower, Loan, Artwork, Settings, LenderFacility } from '../types';

interface OverrideRowProps {
  label: string;
  autoValue: string | number;
  overridden: boolean;
  setOverridden: (value: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  display?: (v: any) => string;
  inputType?: string;
  help?: string;
}

function OverrideRow({
  label,
  autoValue,
  overridden,
  setOverridden,
  value,
  setValue,
  display = (v) => String(v),
  inputType = 'text',
  help,
}: OverrideRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-600">{label}</label>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              overridden ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {overridden ? 'Overridden' : 'Auto'}
          </span>
          <button
            type="button"
            className="text-xs underline hover:text-blue-600"
            onClick={() => setOverridden(!overridden)}
          >
            {overridden ? 'Use auto' : 'Override'}
          </button>
        </div>
      </div>
      <input
        type={inputType}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        readOnly={!overridden}
        value={overridden ? value : display(autoValue)}
        onChange={(e) => overridden && setValue(e.target.value)}
      />
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

interface SectionProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

const Section = ({ title, right, children }: SectionProps) => (
  <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {right}
    </div>
    {children}
  </div>
);

function useDebounce<T extends (...args: any[]) => any>(fn: T, ms = 500) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  return (...args: Parameters<T>) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => fn(...args), ms);
  };
}

export default function DraftLoanBuilder() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [facilities, setFacilities] = useState<LenderFacility[]>([]);

  const [borrowerId, setBorrowerId] = useState('');
  const [availableArtworks, setAvailableArtworks] = useState<Artwork[]>([]);
  const [assignedArtworks, setAssignedArtworks] = useState<Artwork[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState('');

  const [loan, setLoan] = useState<Loan | null>(null);
  const [notes, setNotes] = useState('');

  const [prepaidInterestMonths, setPrepaidInterestMonths] = useState(1);
  const [prepaidFeesUSD, setPrepaidFeesUSD] = useState('0.00');

  const [spreadPct, setSpreadPct] = useState('5.00');

  const [overrideLtv, setOverrideLtv] = useState(false);
  const [ltvPctOverride, setLtvPctOverride] = useState('');

  const [principalUSD, setPrincipalUSD] = useState('');

  const [origFeePct, setOrigFeePct] = useState('2.00');

  const [overrideReason, setOverrideReason] = useState('');

  const [deployFacilityId, setDeployFacilityId] = useState('');
  const [editingLoanName, setEditingLoanName] = useState(false);
  const [editedLoanName, setEditedLoanName] = useState('');
  const [showNewArtworkForm, setShowNewArtworkForm] = useState(false);
  const [newArtworkTitle, setNewArtworkTitle] = useState('');
  const [newArtworkArtist, setNewArtworkArtist] = useState('');
  const [newArtworkMaterials, setNewArtworkMaterials] = useState('');
  const [newArtworkDimensions, setNewArtworkDimensions] = useState('');
  const [newArtworkValue, setNewArtworkValue] = useState('');
  const [interestFrequency, setInterestFrequency] = useState<'monthly' | 'quarterly'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!borrowerId) {
      setAvailableArtworks([]);
      setAssignedArtworks([]);
      setLoan(null);
      return;
    }
    loadArtworks(borrowerId);
    checkForExistingDraft(borrowerId);
  }, [borrowerId]);

  const checkForExistingDraft = async (borrowerId: string) => {
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('borrower_id', borrowerId)
      .eq('status', 'active')
      .is('facility_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLoan(data);
    }
  };

  useEffect(() => {
    if (loan) {
      loadAssignedArtworks();
      setPrepaidFeesUSD(toUSD(loan.prepaid_fees_cents || 0).toFixed(2));
      setPrepaidInterestMonths(loan.prepaid_interest_months || 1);
      setPrincipalUSD(toUSD(loan.principal_cents || 0).toFixed(2));
      setNotes(loan.notes || '');
      setInterestFrequency(loan.interest_frequency || 'monthly');
    }
  }, [loan]);

  const loadData = async () => {
    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
    if (settingsData) setSettings(settingsData);

    const { data: borrowersData } = await supabase
      .from('borrowers')
      .select('*')
      .order('name');
    if (borrowersData) setBorrowers(borrowersData);

    const { data: facilitiesData } = await supabase
      .from('lender_facilities')
      .select('*')
      .eq('status', 'active')
      .order('name');
    if (facilitiesData) setFacilities(facilitiesData);
  };

  const loadArtworks = async (borrowerId: string) => {
    const { data: allArtworks } = await supabase
      .from('artworks')
      .select('*')
      .eq('owner', borrowerId);

    if (!allArtworks) return;

    const { data: assignedArtworkIds } = await supabase
      .from('loan_artworks')
      .select('artwork_id, loan_id')
      .in('artwork_id', allArtworks.map(a => a.id));

    const assignedIds = new Set(
      (assignedArtworkIds || []).map(la => la.artwork_id)
    );

    const assigned = allArtworks.filter(a => assignedIds.has(a.id));
    const available = allArtworks.filter(a => !assignedIds.has(a.id));

    setAvailableArtworks(available);
    if (loan) {
      const loanArtworkIds = new Set(
        (assignedArtworkIds || [])
          .filter(la => la.loan_id === loan.id)
          .map(la => la.artwork_id)
      );
      setAssignedArtworks(allArtworks.filter(a => loanArtworkIds.has(a.id)));
    }
  };

  const loadAssignedArtworks = async () => {
    if (!loan) return;

    const { data: loanArtworks } = await supabase
      .from('loan_artworks')
      .select('artwork_id')
      .eq('loan_id', loan.id);

    if (!loanArtworks) return;

    const artworkIds = loanArtworks.map(la => la.artwork_id);
    if (artworkIds.length === 0) {
      setAssignedArtworks([]);
      return;
    }

    const { data: artworks } = await supabase
      .from('artworks')
      .select('*')
      .in('id', artworkIds);

    if (artworks) setAssignedArtworks(artworks);
  };

  const sumValuationsCents = useMemo(() => {
    return assignedArtworks.reduce((total, artwork) => {
      return total + fromUSD(artwork.appraised_value || 0);
    }, 0);
  }, [assignedArtworks]);

  const primeBps = Number(settings?.prime_rate_bps || 0);
  const spreadBps = Math.round(Number(spreadPct || 0) * 100);
  const rateBps = primeBps + spreadBps;

  const baseLtv = 45;
  const ltvPct = overrideLtv ? Number(ltvPctOverride || baseLtv) : baseLtv;

  const principalCents = principalUSD ? fromUSD(principalUSD) : 0;
  const maxPrincipalCents = Math.floor(sumValuationsCents * (ltvPct / 100));
  const currentLtvPct = sumValuationsCents > 0 ? (principalCents / sumValuationsCents) * 100 : 0;

  const origFeeBps = Math.round(Number(origFeePct || 0) * 100);
  const originationFeeCents = Math.round(principalCents * (origFeeBps / 10000));

  const monthlyRate = rateBps / 10000 / 12;
  const prepaidInterestCents = Math.round(
    principalCents * monthlyRate * Number(prepaidInterestMonths || 0)
  );
  const prepaidFeesCents = prepaidFeesUSD ? fromUSD(prepaidFeesUSD) : 0;
  const totalDeductionsCents = originationFeeCents + prepaidInterestCents + prepaidFeesCents;
  const projectedFundingCents = maxPrincipalCents;
  const netFundingCents = principalCents - totalDeductionsCents;

  const canCreateDraft = borrowerId && assignedArtworks.length > 0;

  const buildPayload = () => ({
    interest_rate_bps: rateBps,
    interest_rate_override_bps: rateBps,
    ltv_pct: ltvPct,
    ltv_override_pct: overrideLtv ? ltvPct : null,
    principal_cents: principalCents,
    principal_override_cents: principalCents,
    prepaid_interest_months: prepaidInterestMonths,
    prepaid_fees_cents: fromUSD(prepaidFeesUSD),
    origination_fee_bps: origFeeBps,
    origination_fee_override_bps: origFeeBps,
    origination_fee_cents: originationFeeCents,
    projected_funding_cents: projectedFundingCents,
    interest_frequency: interestFrequency,
    override_reason:
      overrideLtv
        ? overrideReason
        : null,
  });

  const debouncedPersist = useDebounce(async () => {
    if (!loan) return;

    const payload = buildPayload();
    const newVersion = (loan.version || 1) + 1;

    const { data, error } = await supabase
      .from('loans')
      .update({ ...payload, version: newVersion, updated_at: new Date().toISOString() })
      .eq('id', loan.id)
      .eq('version', loan.version)
      .select()
      .single();

    if (data && !error) {
      setLoan(data);
    }
  }, 600);

  const assignArtwork = async () => {
    if (!selectedArtworkId) {
      alert('Please select an artwork to assign.');
      return;
    }

    if (!loan) {
      alert('Please create a draft loan first.');
      return;
    }

    const { error } = await supabase.from('loan_artworks').insert({
      loan_id: loan.id,
      artwork_id: selectedArtworkId,
    });

    if (error) {
      alert(`Error assigning artwork: ${error.message}`);
      return;
    }

    setSelectedArtworkId('');
    await loadArtworks(borrowerId);
    await loadAssignedArtworks();
  };

  const unassignArtwork = async (artworkId: string) => {
    if (!loan) return;

    const { error } = await supabase
      .from('loan_artworks')
      .delete()
      .eq('loan_id', loan.id)
      .eq('artwork_id', artworkId);

    if (error) {
      alert(`Error unassigning artwork: ${error.message}`);
      return;
    }

    await loadArtworks(borrowerId);
    await loadAssignedArtworks();
  };

  const handleNewArtworkCreated = async () => {
    if (!borrowerId || !newArtworkTitle || !newArtworkArtist || !newArtworkValue) {
      alert('Please fill in all required fields (Title, Artist, Appraised Value)');
      return;
    }

    const borrower = borrowers.find(b => b.id === borrowerId);
    const { data, error } = await supabase
      .from('artworks')
      .insert({
        owner: borrower?.name || '',
        title: newArtworkTitle,
        artist: newArtworkArtist,
        materials: newArtworkMaterials || null,
        dimensions: newArtworkDimensions || null,
        appraised_value: newArtworkValue
      })
      .select()
      .single();

    if (error) {
      alert(`Error creating artwork: ${error.message}`);
      return;
    }

    if (data && loan) {
      const { error: assignError } = await supabase
        .from('loan_artworks')
        .insert({ loan_id: loan.id, artwork_id: data.id });

      if (assignError) {
        alert(`Artwork created but could not assign to loan: ${assignError.message}`);
      }
    }

    setNewArtworkTitle('');
    setNewArtworkArtist('');
    setNewArtworkMaterials('');
    setNewArtworkDimensions('');
    setNewArtworkValue('');
    setShowNewArtworkForm(false);

    await loadArtworks(borrowerId);
    await loadAssignedArtworks();
    alert('Artwork created and automatically assigned to this loan!');
  };

  const createDraft = async () => {
    if (!borrowerId) {
      alert('Please select a borrower first.');
      return;
    }

    const payload = {
      borrower_id: borrowerId,
      status: 'active',
      loan_name: `Draft Loan - ${new Date().toLocaleDateString()}`,
      rate_type: 'floating',
      spread: 5,
      principal: toUSD(principalCents),
      ...buildPayload(),
    };

    const { data, error } = await supabase.from('loans').insert(payload).select().single();

    if (error) {
      alert(`Error creating loan: ${error.message}`);
      return;
    }

    if (data) {
      setLoan(data);
      alert('Draft loan created. Now assign artworks to this loan.');
    }
  };

  const deleteDraft = async () => {
    if (!loan) return;

    if (!confirm(`Are you sure you want to delete this draft loan? This will also remove all artwork assignments for this loan.`)) {
      return;
    }

    const { error: artworksError } = await supabase
      .from('loan_artworks')
      .delete()
      .eq('loan_id', loan.id);

    if (artworksError) {
      alert(`Error deleting loan artworks: ${artworksError.message}`);
      return;
    }

    const { error: loanError } = await supabase
      .from('loans')
      .delete()
      .eq('id', loan.id);

    if (loanError) {
      alert(`Error deleting loan: ${loanError.message}`);
      return;
    }

    setLoan(null);
    setAssignedArtworks([]);
    alert('Draft loan deleted successfully.');
  };

  const updateLoanName = async () => {
    if (!loan) return;
    if (!editedLoanName.trim()) {
      alert('Loan name cannot be empty.');
      return;
    }

    const { error } = await supabase
      .from('loans')
      .update({ loan_name: editedLoanName.trim() })
      .eq('id', loan.id);

    if (error) {
      alert(`Error updating loan name: ${error.message}`);
      return;
    }

    setLoan({ ...loan, loan_name: editedLoanName.trim() });
    setEditingLoanName(false);
  };

  const saveDraft = async () => {
    if (!loan) {
      return createDraft();
    }

    const payload = buildPayload();
    const newVersion = (loan.version || 1) + 1;

    const { data, error } = await supabase
      .from('loans')
      .update({ ...payload, version: newVersion, updated_at: new Date().toISOString() })
      .eq('id', loan.id)
      .eq('version', loan.version)
      .select()
      .single();

    if (error || !data) {
      alert('This loan was modified elsewhere. Reload and try again.');
      return;
    }

    setLoan(data);
    alert('Draft saved.');
  };

  const fund = async () => {
    if (!loan) {
      alert('Save draft first.');
      return;
    }

    if (overrideLtv && !overrideReason) {
      alert('Provide an override reason before funding.');
      return;
    }

    const requestId = crypto.randomUUID();
    const newVersion = (loan.version || 1) + 1;

    const { error: loanError } = await supabase
      .from('loans')
      .update({ status: 'active', version: newVersion })
      .eq('id', loan.id)
      .eq('version', loan.version);

    if (loanError) {
      alert(`Error updating loan: ${loanError.message}`);
      return;
    }

    const { error: txError } = await supabase.from('transactions').insert({
      loan_id: loan.id,
      type: 'advance',
      amount: toUSD(projectedFundingCents),
      note: `Funding transaction: Principal ${usdStr(principalCents)}, Prepaid Interest ${usdStr(
        prepaidInterestCents
      )}, Prepaid Fees ${usdStr(fromUSD(prepaidFeesUSD))}, Origination Fee ${usdStr(
        originationFeeCents
      )}`,
      request_id: requestId,
    });

    if (txError) {
      alert(`Error creating transaction: ${txError.message}`);
      return;
    }

    const { data: updatedLoan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loan.id)
      .single();

    if (updatedLoan) setLoan(updatedLoan);
    alert('Loan funded and funding transaction posted.');
  };

  const deploy = async () => {
    if (!loan) {
      alert('Save draft first.');
      return;
    }

    if (!deployFacilityId) {
      alert('Select a facility to deploy.');
      return;
    }

    const requestId = crypto.randomUUID();
    const newVersion = (loan.version || 1) + 1;

    const { error: loanError } = await supabase
      .from('loans')
      .update({ status: 'active', facility_id: deployFacilityId, version: newVersion })
      .eq('id', loan.id)
      .eq('version', loan.version);

    if (loanError) {
      alert(`Error updating loan: ${loanError.message}`);
      return;
    }

    const { error: txError } = await supabase.from('facility_transactions').insert({
      facility_id: deployFacilityId,
      date: new Date().toISOString().split('T')[0],
      type: 'draw',
      amount: toUSD(projectedFundingCents),
      note: `Loan deployment for ${loan.loan_name}`,
    });

    if (txError) {
      alert(`Error creating facility transaction: ${txError.message}`);
      return;
    }

    const { data: updatedLoan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loan.id)
      .single();

    if (updatedLoan) setLoan(updatedLoan);
    alert('Loan deployed to selected facility.');
  };

  const downloadProceedsSchedule = () => {
    if (!borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const pdf = generateProceedsSchedulePDF({
      borrower,
      projectedFunding: projectedFundingCents,
      originationFee: originationFeeCents,
      prepaidInterest: prepaidInterestCents,
      prepaidFees: prepaidFeesCents,
      netProceeds: netFundingCents,
      principal: principalCents,
      interestRate: rateBps,
      ltvPct,
      totalAppraisedValue: sumValuationsCents
    });

    pdf.save(`Proceeds_Schedule_${borrower.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadArtworkValuation = () => {
    if (!loan || !borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const totalAppraisedValue = assignedArtworks.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateArtworkValuationPDF({
      loan,
      borrower,
      artworks: assignedArtworks,
      totalAppraisedValue
    });

    pdf.save(`Artwork_Valuation_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  const downloadLoanTerms = () => {
    if (!loan || !borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const totalAppraisedValue = assignedArtworks.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateLoanTermsPDF({
      loan,
      borrower,
      artworks: assignedArtworks,
      totalAppraisedValue
    });

    pdf.save(`Loan_Terms_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  const downloadFundingStatement = () => {
    if (!loan || !borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const totalAppraisedValue = assignedArtworks.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateFundingStatementPDF({
      loan,
      borrower,
      artworks: assignedArtworks,
      totalAppraisedValue
    });

    pdf.save(`Funding_Statement_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  const downloadCompletePackage = () => {
    if (!loan || !borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const totalAppraisedValue = assignedArtworks.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateCombinedLoanPackagePDF({
      loan,
      borrower,
      artworks: assignedArtworks,
      totalAppraisedValue
    });

    pdf.save(`Complete_Loan_Package_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  const downloadLenderIncomeStatement = () => {
    if (!loan || !borrowerId) return;

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const totalAppraisedValue = assignedArtworks.reduce((sum, a) => sum + a.appraised_value, 0);

    const pdf = generateLenderIncomeStatementPDF({
      loan,
      borrower,
      artworks: assignedArtworks,
      totalAppraisedValue
    });

    pdf.save(`Lender_Income_Statement_${loan.loan_name || loan.id.slice(0, 8)}.pdf`);
  };

  useEffect(() => {
    if (loan) debouncedPersist();
  }, [
    prepaidInterestMonths,
    prepaidFeesUSD,
    spreadPct,
    ltvPctOverride,
    overrideLtv,
    principalUSD,
    origFeePct,
    overrideReason,
    notes,
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Curated Capital Group — Draft Loan Builder</h1>

      <Section title="1. Select Borrower">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Borrower</label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
                disabled={!!loan}
              >
                <option value="">Select borrower…</option>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {loan ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-sm">
                    <p className="text-green-800 font-medium">✓ Working on Existing Draft</p>
                    {editingLoanName ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 text-xs border rounded"
                          value={editedLoanName}
                          onChange={(e) => setEditedLoanName(e.target.value)}
                          placeholder="Loan name"
                        />
                        <button
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={updateLoanName}
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                          onClick={() => {
                            setEditingLoanName(false);
                            setEditedLoanName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-green-600 flex-1">
                          {loan.loan_name} (v{loan.version})
                        </p>
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setEditedLoanName(loan.loan_name);
                            setEditingLoanName(true);
                          }}
                        >
                          Edit Name
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-xl bg-gray-600 text-white text-sm hover:bg-gray-700"
                      onClick={() => {
                        setLoan(null);
                        setAssignedArtworks([]);
                      }}
                    >
                      Start New Draft
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
                      onClick={deleteDraft}
                    >
                      Delete Draft
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={createDraft}
                  disabled={!borrowerId}
                >
                  Create New Draft Loan
                </button>
              )}
            </div>
          </div>

        </div>
      </Section>

      {loan && (
        <Section title="2. Assign Artworks">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">Add artworks to this loan as collateral</p>
              <button
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                onClick={() => setShowNewArtworkForm(!showNewArtworkForm)}
              >
                {showNewArtworkForm ? 'Cancel' : '+ Add New Artwork'}
              </button>
            </div>

            {showNewArtworkForm && (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 mb-4">
                <h3 className="font-semibold text-sm mb-3 text-blue-900">Create New Artwork</h3>
                <p className="text-xs text-blue-700 mb-3">
                  New artwork will be assigned to {borrowers.find(b => b.id === borrowerId)?.name}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700">Title *</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                      value={newArtworkTitle}
                      onChange={(e) => setNewArtworkTitle(e.target.value)}
                      placeholder="Artwork title"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Artist *</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                      value={newArtworkArtist}
                      onChange={(e) => setNewArtworkArtist(e.target.value)}
                      placeholder="Artist name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Materials</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                      value={newArtworkMaterials}
                      onChange={(e) => setNewArtworkMaterials(e.target.value)}
                      placeholder="e.g., Oil on canvas"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Dimensions</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                      value={newArtworkDimensions}
                      onChange={(e) => setNewArtworkDimensions(e.target.value)}
                      placeholder='e.g., 24" x 36"'
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-700">Appraised Value (USD) *</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
                      value={newArtworkValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setNewArtworkValue(val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value && !isNaN(Number(e.target.value))) {
                          const formatted = Number(e.target.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          e.target.value = `$${formatted}`;
                        }
                      }}
                      onFocus={(e) => {
                        const val = e.target.value.replace(/[$,]/g, '');
                        e.target.value = val;
                      }}
                      placeholder="Enter amount (e.g., 1000000)"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
                    onClick={handleNewArtworkCreated}
                  >
                    Create Artwork
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                    onClick={() => setShowNewArtworkForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {assignedArtworks.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 block mb-2">Assigned to this Loan ({assignedArtworks.length})</label>
                <div className="border rounded-xl p-3 space-y-2">
                  {assignedArtworks.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-gray-600">
                          by {a.artist} • {usdStr(fromUSD(a.appraised_value))}
                        </p>
                      </div>
                      <button
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                        onClick={() => unassignArtwork(a.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm font-medium">Total Collateral Value: {usdStr(sumValuationsCents)}</p>
                  </div>
                </div>
              </div>
            )}

            {assignedArtworks.length === 0 && (
              <p className="text-sm text-amber-700">
                No artworks assigned yet. Assign at least one artwork to calculate LTV and proceed.
              </p>
            )}
          </div>
        </Section>
      )}

      {loan && assignedArtworks.length > 0 && (
        <Section title="3. Configure Terms (fully editable with safe overrides)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Prime (%, from Settings)</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              readOnly
              value={(primeBps / 100).toFixed(2) + '%'}
            />
            <p className="text-xs text-gray-500 mt-1">{primeBps} bps</p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Interest Rate Spread (%) *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Prime ({(primeBps / 100).toFixed(2)}%) +</span>
              <input
                type="number"
                step="0.01"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={spreadPct}
                onChange={(e) => setSpreadPct(e.target.value)}
                placeholder="5.00"
                required
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total Rate: {(rateBps / 100).toFixed(2)}%
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Interest Frequency *</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={interestFrequency}
              onChange={(e) => setInterestFrequency(e.target.value as 'monthly' | 'quarterly')}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How often interest is charged
            </p>
          </div>

          <OverrideRow
            label="LTV (%)"
            autoValue={baseLtv}
            overridden={overrideLtv}
            setOverridden={setOverrideLtv}
            value={ltvPctOverride}
            setValue={setLtvPctOverride}
            display={(v) => String(v)}
          />

          <div>
            <label className="text-sm text-gray-600">Principal (USD) *</label>
            <input
              type="text"
              className={`w-full rounded-xl border px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                principalCents > maxPrincipalCents ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              value={principalUSD}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setPrincipalUSD(val);
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
          </div>

          <div>
            <label className="text-sm text-gray-600">Prepaid interest (months)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={prepaidInterestMonths}
              onChange={(e) => setPrepaidInterestMonths(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Interest Amount: {usdStr(prepaidInterestCents)}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Origination Fee (%) *</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={origFeePct}
              onChange={(e) => setOrigFeePct(e.target.value)}
              placeholder="2.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Fee Amount: {usdStr(originationFeeCents)}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Prepaid fees (USD)</label>
            <input
              type="text"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={prepaidFeesUSD}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setPrepaidFeesUSD(val);
              }}
              onBlur={(e) => {
                if (e.target.value && !isNaN(Number(e.target.value))) {
                  const formatted = Number(e.target.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  e.target.value = `$${formatted}`;
                }
              }}
              onFocus={(e) => {
                const val = e.target.value.replace(/[$,]/g, '');
                e.target.value = val;
              }}
              placeholder="Enter amount (e.g., 10000)"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Origination Fee (USD)</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              readOnly
              value={usdStr(originationFeeCents)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Total Deductions (USD)</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm bg-red-50 text-red-900"
              readOnly
              value={usdStr(totalDeductionsCents)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Origination Fee ({usdStr(originationFeeCents)}) + Prepaid Interest ({usdStr(prepaidInterestCents)}) + Prepaid Fees ({usdStr(prepaidFeesCents)})
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Net Funding to Borrower (USD)</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm font-bold bg-green-50 text-green-900"
              readOnly
              value={usdStr(netFundingCents)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Principal ({usdStr(principalCents)}) − Total Deductions ({usdStr(totalDeductionsCents)})
            </p>
          </div>
        </div>

        {overrideLtv && (
          <div className="mt-3">
            <label className="text-sm text-gray-600">
              Override reason (required if any overrides are used)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>
        )}

        <div className="mt-4 flex gap-3 items-center">
          <button
            className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm hover:bg-gray-900"
            onClick={saveDraft}
          >
            Save Changes
          </button>
          {loan && <span className="text-xs text-gray-500">Version: {loan.version}</span>}
        </div>
        </Section>
      )}

      {loan && assignedArtworks.length > 0 && (
      <Section title="4. Download Documents">
        <div className="grid grid-cols-1 gap-3">
          <p className="text-sm text-gray-600">Generate PDF documents for this draft loan</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 font-semibold"
              onClick={downloadProceedsSchedule}
            >
              Proceeds Schedule
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm hover:bg-slate-700"
              onClick={downloadArtworkValuation}
            >
              Artwork Valuation
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm hover:bg-slate-700"
              onClick={downloadLoanTerms}
            >
              Loan Terms
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm hover:bg-slate-700"
              onClick={downloadFundingStatement}
            >
              Funding Statement
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm hover:bg-slate-800 font-semibold"
              onClick={downloadCompletePackage}
            >
              Complete Package
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Lender-Only Documents (Not for Borrower)</p>
            <button
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={downloadLenderIncomeStatement}
            >
              Lender Income Statement
            </button>
          </div>
        </div>
      </Section>
      )}

      {loan && assignedArtworks.length > 0 && (
      <Section
        title="5. Fund & Deploy"
        right={
          <span className="text-sm text-gray-500">
            Flow: Draft → <b>Fund</b> → <b>Deploy</b>
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-sm text-gray-600">Facility (for deployment)</label>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={deployFacilityId}
              onChange={(e) => setDeployFacilityId(e.target.value)}
            >
              <option value="">Select facility…</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={fund}
            disabled={!loan}
          >
            Fund Loan
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={deploy}
            disabled={!loan || !deployFacilityId}
          >
            Deploy Loan to Facility
          </button>
        </div>
      </Section>
      )}
    </div>
  );
}
