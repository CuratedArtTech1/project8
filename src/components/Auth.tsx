import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Label, Input, Button } from './UI';

const MASTER_PASSCODE = '800522';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    if (password !== MASTER_PASSCODE && password.length < 6) {
      setError('Password must be at least 6 characters or use the master passcode.');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setError('');
        setMode('signin');
        alert('Account created! You can now sign in.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid') || signInError.message.includes('credentials')) {
          setError('Invalid email or password. If you haven\'t created an account yet, click "Create Account" below.');
        } else {
          setError(signInError.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 border">
        <h1 className="text-xl font-semibold mb-2">CCG Art Loan Tracker</h1>
        <p className="text-sm text-gray-600 mb-6">
          {mode === 'signin' ? 'Sign in to access the loan management system' : 'Create your account'}
        </p>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
