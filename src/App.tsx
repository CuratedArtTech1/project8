import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { BorrowerPage } from './components/BorrowerPage';
import { FacilityPage } from './components/FacilityPage';
import { UserManagement } from './components/UserManagement';
import DraftLoanBuilder from './components/DraftLoanBuilder';
import type { User } from '@supabase/supabase-js';

type Route = { page: 'home' } | { page: 'borrower'; borrowerId: string } | { page: 'facility'; facilityId: string } | { page: 'users' } | { page: 'loan-builder' };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Error getting session:', err);
      setError('Failed to initialize authentication. Please refresh the page.');
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return <Dashboard onNavigateToBorrower={navigateToBorrower} onNavigateToFacility={navigateToFacility} onNavigateToUserManagement={navigateToUserManagement} onNavigateToLoanBuilder={navigateToLoanBuilder} onSignOut={handleSignOut} userEmail={user.email || ''} />;
}
