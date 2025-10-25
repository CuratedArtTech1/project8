/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Section, Label, Input, Button, Badge } from './UI';
import { currency, inDays } from '../lib/utils';
// import { BorrowerForm } from './forms/BorrowerForm';
// import { ArtworkForm } from './forms/ArtworkForm';
// import { BulkArtworkImport } from './forms/BulkArtworkImport';
// import { AssignArtworkForm } from './forms/AssignArtworkForm';
// import { COIEditForm } from './forms/COIEditForm';
// import { UCCUpload } from './forms/UCCUpload';
// import { COIUpload } from './forms/COIUpload';
// import { FacilityForm } from './forms/FacilityForm';
import type { Borrower, Artwork, Loan, Settings, Transaction, COIRecord, LoanArtwork, LenderFacility } from '../types';

interface DashboardProps {
  onNavigateToBorrower: (borrowerId: string) => void;
  onNavigateToFacility: (facilityId: string) => void;
  onNavigateToUserManagement: () => void;
  onNavigateToLoanBuilder: () => void;
  onSignOut: () => void;
  userEmail: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToBorrower, onNavigateToFacility, onNavigateToUserManagement, onNavigateToLoanBuilder, onSignOut, userEmail }) => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coiRecords, setCOIRecords] = useState<COIRecord[]>([]);
  const [loanArtworks, setLoanArtworks] = useState<LoanArtwork[]>([]);
  const [facilities, setFacilities] = useState<LenderFacility[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCOIArtworkId, setEditingCOIArtworkId] = useState<string | null>(null);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<Set<string>>(new Set());
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [newBorrower, setNewBorrower] = useState({ name: '', contact: '', note: '' });
  const [newFacility, setNewFacility] = useState({ name: '', lender_name: '', facility_limit: '', interest_rate_floor: '', origination_fee_pct: '', note: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [borrowersRes, artworksRes, loansRes, transactionsRes, coiRes, loanArtworksRes, facilitiesRes, settingsRes] = await Promise.all([
        supabase.from('borrowers').select('*').order('name'),
        supabase.from('artworks').select('*').order('artist'),
        supabase.from('loans').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('coi_records').select('*'),
        supabase.from('loan_artworks').select('*'),
        supabase.from('lender_facilities').select('*').order('name'),
        supabase.from('settings').select('*').limit(1).single(),
      ]);

      if (borrowersRes.data) setBorrowers(borrowersRes.data);
      if (artworksRes.data) setArtworks(artworksRes.data);
      if (loansRes.data) setLoans(loansRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (coiRes.data) setCOIRecords(coiRes.data);
      if (loanArtworksRes.data) setLoanArtworks(loanArtworksRes.data);
      if (facilitiesRes.data) setFacilities(facilitiesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateSettings = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const { error } = await supabase
      .from('settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', settings.id);
    if (!error) {
      setSettings({ ...settings, ...patch });
    }
  };

  const deleteBorrower = async (id: string) => {
    if (loans.some((l) => l.borrower_id === id)) {
      alert('Cannot delete borrower with linked loans. Reassign or delete loans first.');
      return;
    }
    const { error } = await supabase.from('borrowers').delete().eq('id', id);
    if (!error) {
      setBorrowers(borrowers.filter((b) => b.id !== id));
    }
  };

  const deleteFacility = async (id: string) => {
    if (loans.some((l) => l.facility_id === id)) {
      alert('Cannot delete facility with linked loans. Reassign or delete loans first.');
      return;
    }
    const { error } = await supabase.from('lender_facilities').delete().eq('id', id);
    if (!error) {
      setFacilities(facilities.filter((f) => f.id !== id));
    }
  };

  const availableArtworks = artworks.filter((a) => !loanArtworks.some((la) => la.artwork_id === a.id));

  const toggleArtworkSelection = (artworkId: string) => {
    const newSelection = new Set(selectedArtworkIds);
    if (newSelection.has(artworkId)) {
      newSelection.delete(artworkId);
    } else {
      newSelection.add(artworkId);
    }
    setSelectedArtworkIds(newSelection);
  };

  const selectAllArtworks = () => {
    const allIds = new Set(availableArtworks.map(a => a.id));
    setSelectedArtworkIds(allIds);
  };

  const deselectAllArtworks = () => {
    setSelectedArtworkIds(new Set());
  };

  const deleteArtwork = async (id: string) => {
    if (loanArtworks.some((la) => la.artwork_id === id)) {
      alert('Cannot delete artwork used as collateral. Remove from loans first.');
      return;
    }
    const { error } = await supabase.from('artworks').delete().eq('id', id);
    if (!error) {
      setArtworks(artworks.filter((a) => a.id !== id));
    }
  };

  const handleAddBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBorrower.name.trim()) {
      alert('Please enter a borrower name');
      return;
    }

    const { error } = await supabase.from('borrowers').insert([newBorrower]);
    if (error) {
      alert(`Failed to add borrower: ${error.message}`);
    } else {
      setNewBorrower({ name: '', contact: '', note: '' });
      setShowAddBorrower(false);
      loadData();
    }
  };

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacility.name.trim() || !newFacility.lender_name.trim()) {
      alert('Please enter facility name and lender name');
      return;
    }

    const { error } = await supabase.from('lender_facilities').insert([{
      name: newFacility.name,
      lender_name: newFacility.lender_name,
      facility_limit: Number(newFacility.facility_limit) || 0,
      interest_rate_floor: Number(newFacility.interest_rate_floor) || 0,
      origination_fee_pct: Number(newFacility.origination_fee_pct) || 0,
      note: newFacility.note,
    }]);

    if (error) {
      alert(`Failed to add facility: ${error.message}`);
    } else {
      setNewFacility({ name: '', lender_name: '', facility_limit: '', interest_rate_floor: '', origination_fee_pct: '', note: '' });
      setShowAddFacility(false);
      loadData();
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
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
          <div className="flex-1"></div>
          <div className="flex items-end gap-3">
            {settings && (
              <>
                <div>
                  <Label>Prime Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.prime_rate}
                    onChange={(e) => updateSettings({ prime_rate: Number(e.target.value || 0) })}
                    style={{ width: 110 }}
                  />
                </div>
                <div>
                  <Label>LTV Limit (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.ltv_limit}
                    onChange={(e) => updateSettings({ ltv_limit: Number(e.target.value || 0) })}
                    style={{ width: 110 }}
                  />
                </div>
              </>
            )}
            <div className="text-xs text-gray-600">
              <Badge tone="blue">{userEmail}</Badge>
            </div>
            <Button variant="outline" onClick={onNavigateToLoanBuilder}>
              Loan Builder
            </Button>
            <Button variant="outline" onClick={onNavigateToUserManagement}>
              User Management
            </Button>
            <Button variant="outline" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Borrowers</div>
            <div className="text-3xl font-bold">{borrowers.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Active Loans</div>
            <div className="text-3xl font-bold">{loans.filter((l) => l.status === 'active').length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Artworks</div>
            <div className="text-3xl font-bold">{artworks.length}</div>
          </div>
        </div>

        <Section title="Lender Facilities" collapsible defaultOpen={true}>
          <div className="mb-4">
            {!showAddFacility ? (
              <Button variant="solid" onClick={() => setShowAddFacility(true)}>
                + Add New Facility
              </Button>
            ) : (
              <form onSubmit={handleAddFacility} className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Facility Name *</Label>
                    <Input
                      value={newFacility.name}
                      onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                      placeholder="e.g., Credit Line A"
                      required
                    />
                  </div>
                  <div>
                    <Label>Lender Name *</Label>
                    <Input
                      value={newFacility.lender_name}
                      onChange={(e) => setNewFacility({ ...newFacility, lender_name: e.target.value })}
                      placeholder="e.g., ABC Bank"
                      required
                    />
                  </div>
                  <div>
                    <Label>Facility Limit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newFacility.facility_limit}
                      onChange={(e) => setNewFacility({ ...newFacility, facility_limit: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Interest Rate Floor (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newFacility.interest_rate_floor}
                      onChange={(e) => setNewFacility({ ...newFacility, interest_rate_floor: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Origination Fee (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newFacility.origination_fee_pct}
                      onChange={(e) => setNewFacility({ ...newFacility, origination_fee_pct: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input
                      value={newFacility.note}
                      onChange={(e) => setNewFacility({ ...newFacility, note: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="solid">Add Facility</Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddFacility(false);
                    setNewFacility({ name: '', lender_name: '', facility_limit: '', interest_rate_floor: '', origination_fee_pct: '', note: '' });
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Facility Name</th>
                  <th className="text-left p-3">Lender</th>
                  <th className="text-right p-3">Facility Limit</th>
                  <th className="text-right p-3">Utilization</th>
                  <th className="text-right p-3">Int. & Fees Due</th>
                  <th className="text-left p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => {
                  const facilityLoans = loans.filter((l) => l.facility_id === f.id && l.status === 'active');
                  const deployed = facilityLoans.reduce((sum, l) => sum + loanBalance(l.id), 0);
                  const intFeesDue = facilityLoans.reduce((sum, l) => sum + interestAndFeesDue(l.id), 0);
                  const utilizationPct = f.facility_limit > 0 ? (deployed / f.facility_limit) * 100 : 0;

                  return (
                    <tr key={f.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{f.name}</td>
                      <td className="p-3">{f.lender_name}</td>
                      <td className="p-3 text-right">{currency(f.facility_limit)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{currency(deployed)}</span>
                          <span className="text-xs text-gray-500">({utilizationPct.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {intFeesDue > 0 ? (
                          <span className="font-semibold text-red-600">{currency(intFeesDue)}</span>
                        ) : (
                          <span className="text-gray-400">{currency(0)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge tone={f.status === 'active' ? 'green' : 'gray'}>{f.status}</Badge>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button variant="solid" onClick={() => onNavigateToFacility(f.id)}>
                          View Details
                        </Button>
                        <Button variant="danger" onClick={() => deleteFacility(f.id)}>
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


        {/* <Section title="Quick Actions" collapsible defaultOpen={false}>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Add New Borrower</h3>
              <BorrowerForm onSuccess={loadData} />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Add Lender Facility</h3>
              <FacilityForm onSuccess={loadData} />
            </div>
          </div>
        </Section> */}

        <Section title="Borrowers" collapsible defaultOpen={false}>
          <div className="mb-4">
            {!showAddBorrower ? (
              <Button variant="solid" onClick={() => setShowAddBorrower(true)}>
                + Add New Borrower
              </Button>
            ) : (
              <form onSubmit={handleAddBorrower} className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Borrower Name *</Label>
                    <Input
                      value={newBorrower.name}
                      onChange={(e) => setNewBorrower({ ...newBorrower, name: e.target.value })}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label>Contact (Email)</Label>
                    <Input
                      type="email"
                      value={newBorrower.contact}
                      onChange={(e) => setNewBorrower({ ...newBorrower, contact: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input
                      value={newBorrower.note}
                      onChange={(e) => setNewBorrower({ ...newBorrower, note: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="solid">Add Borrower</Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddBorrower(false);
                    setNewBorrower({ name: '', contact: '', note: '' });
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-right p-3">Outstanding Balance</th>
                  <th className="text-right p-3">Int. & Fees Due</th>
                  <th className="text-left p-3">Note</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowers.map((b) => {
                  const borrowerLoans = loans.filter((l) => l.borrower_id === b.id);
                  const totalBalance = borrowerLoans.reduce((sum, l) => sum + loanBalance(l.id), 0);
                  const totalIntFeesDue = borrowerLoans.reduce((sum, l) => sum + interestAndFeesDue(l.id), 0);

                  return (
                    <tr key={b.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3">{b.contact}</td>
                      <td className="p-3 text-right">{currency(totalBalance)}</td>
                      <td className="p-3 text-right">
                        {totalIntFeesDue > 0 ? (
                          <span className="font-semibold text-red-600">{currency(totalIntFeesDue)}</span>
                        ) : (
                          <span className="text-gray-400">{currency(0)}</span>
                        )}
                      </td>
                      <td className="p-3">{b.note}</td>
                      <td className="p-3 text-right space-x-2">
                        <Button variant="outline" onClick={() => onNavigateToBorrower(b.id)}>
                          Open
                        </Button>
                        <Button variant="danger" onClick={() => deleteBorrower(b.id)}>
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

        <Section title="Available Collateral Artworks" collapsible defaultOpen={false}>
          {/* <BulkArtworkImport onSuccess={loadData} /> */}

          <div className="mt-4 mb-4 flex items-center justify-between">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
              <p className="text-sm text-blue-800">
                <strong>Available Artworks:</strong> Showing only artworks not yet assigned to any loan. Allocated artworks are hidden.
              </p>
            </div>
            <div className="ml-4 flex gap-2">
              {selectedArtworkIds.size > 0 ? (
                <>
                  <span className="text-sm text-gray-600 self-center">
                    {selectedArtworkIds.size} selected
                  </span>
                  <Button variant="solid" onClick={() => setShowAssignForm(true)}>
                    Assign to Loan
                  </Button>
                  <Button variant="outline" onClick={deselectAllArtworks}>
                    Deselect All
                  </Button>
                </>
              ) : (
                <Button variant="solid" onClick={selectAllArtworks} disabled={availableArtworks.length === 0}>
                  Select All
                </Button>
              )}
            </div>
          </div>

          {/* {showAssignForm && selectedArtworkIds.size > 0 && (
            <div className="mb-4">
              <AssignArtworkForm
                artworkIds={Array.from(selectedArtworkIds)}
                loans={loans}
                borrowers={borrowers}
                onSuccess={() => {
                  setShowAssignForm(false);
                  setSelectedArtworkIds(new Set());
                  loadData();
                }}
                onCancel={() => setShowAssignForm(false)}
              />
            </div>
          )} */}
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={availableArtworks.length > 0 && selectedArtworkIds.size === availableArtworks.length}
                      onChange={() => {
                        if (selectedArtworkIds.size === availableArtworks.length) {
                          deselectAllArtworks();
                        } else {
                          selectAllArtworks();
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="text-left p-3">Artist</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Dimensions</th>
                  <th className="text-left p-3">Materials</th>
                  <th className="text-right p-3">Appraised Value</th>
                  <th className="text-left p-3">Owner (Borrower)</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">COI Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableArtworks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No available artworks. All artworks are currently assigned to loans.
                    </td>
                  </tr>
                ) : (
                  availableArtworks.map((a) => (
                    <React.Fragment key={a.id}>
                    <tr className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedArtworkIds.has(a.id)}
                        onChange={() => toggleArtworkSelection(a.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-3 font-medium">{a.artist}</td>
                    <td className="p-3">{a.title}</td>
                    <td className="p-3">{a.dimensions || '—'}</td>
                    <td className="p-3">{a.materials || '—'}</td>
                    <td className="p-3 text-right">{currency(a.appraised_value)}</td>
                    <td className="p-3">
                      <select
                        className="text-sm border rounded px-2 py-1"
                        value={a.owner || ''}
                        onChange={async (e) => {
                          const { error } = await supabase
                            .from('artworks')
                            .update({ owner: e.target.value || null })
                            .eq('id', a.id);
                          if (!error) loadData();
                        }}
                      >
                        <option value="">Unassigned</option>
                        {borrowers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">{a.location || '—'}</td>
                    <td className="p-3">{coiStatusBadge(a)}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        variant="solid"
                        onClick={() => {
                          setSelectedArtworkIds(new Set([a.id]));
                          setShowAssignForm(true);
                        }}
                      >
                        Assign
                      </Button>
                      <Button variant="outline" onClick={() => setEditingCOIArtworkId(a.id)}>
                        Edit COI
                      </Button>
                      <Button variant="danger" onClick={() => deleteArtwork(a.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                  {/* {editingCOIArtworkId === a.id && (
                    <tr className="border-t">
                      <td colSpan={10} className="p-0">
                        <COIEditForm
                          coi={getCOIForArtwork(a.id) || null}
                          artworkId={a.id}
                          onSuccess={() => {
                            setEditingCOIArtworkId(null);
                            loadData();
                          }}
                          onCancel={() => setEditingCOIArtworkId(null)}
                        />
                      </td>
                    </tr>
                  )} */}
                  </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Settings" collapsible defaultOpen={false}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Prime Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings?.prime_rate || 0}
                  onChange={(e) => updateSettings({ prime_rate: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>LTV Limit (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings?.ltv_limit || 45}
                  onChange={(e) => updateSettings({ ltv_limit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Email Settings</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To enable email functionality, you need a Resend API key.
                  The system will automatically send monthly statements to borrowers with email addresses in their contact field.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="auto-send"
                    checked={settings?.auto_send_monthly_statements || false}
                    onChange={(e) => updateSettings({ auto_send_monthly_statements: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="auto-send" className="cursor-pointer text-sm font-medium">
                    Automatically send monthly statements via email
                  </label>
                </div>

                {settings?.auto_send_monthly_statements && (
                  <div>
                    <Label>Day of Month to Send Statements (1-28)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={settings?.statement_day_of_month || 1}
                      onChange={(e) => updateSettings({ statement_day_of_month: Number(e.target.value) })}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Statements will be sent on day {settings?.statement_day_of_month || 1} of each month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
};
