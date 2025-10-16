import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Section, Label, Input, Button, Badge } from './UI';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserManagementProps {
  onBack: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to view users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users/list`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const response = await fetch(apiUrl, { headers });
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading users:', result);
        alert(`Failed to load users: ${result.error}`);
      } else if (result.users) {
        setUsers(result.users.map((u: any) => ({
          id: u.id,
          email: u.email || 'No email',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !invitePassword) {
      alert('Please enter both email and password');
      return;
    }

    if (invitePassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to create users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users/create`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail, password: invitePassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error creating user:', result);
        alert(`Failed to create user: ${result.error}`);
      } else {
        alert(`User ${inviteEmail} has been created successfully!`);
        setInviteEmail('');
        setInvitePassword('');
        loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to delete users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users/delete/${userId}`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error deleting user:', result);
        alert(`Failed to delete user: ${result.error}`);
      } else {
        alert('User deleted successfully');
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Back to Dashboard
          </Button>
          <div className="flex-1"></div>
          <h1 className="text-xl font-bold">User Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Section title="Create New User">
          <form onSubmit={handleInviteUser} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="solid" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              The user will be created with the specified password and can log in immediately.
            </p>
          </form>
        </Section>

        <Section title="All Users">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Last Sign In</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{user.email}</td>
                      <td className="p-3">{formatDate(user.created_at)}</td>
                      <td className="p-3">{formatDate(user.last_sign_in_at)}</td>
                      <td className="p-3 text-center">
                        <Badge tone={user.last_sign_in_at ? 'green' : 'gray'}>
                          {user.last_sign_in_at ? 'Active' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          Delete
                        </Button>
                      </td>
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
