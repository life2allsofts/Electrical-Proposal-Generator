import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLoginSuccess: (session: UserSession) => void;
  isLoading: boolean;
  errorMsg: string | null;
  onClearError: () => void;
  onSubmitAuth: (email: string, pass: string, isRegister: boolean) => void;
}

export default function Login({ 
  onLoginSuccess, 
  isLoading, 
  errorMsg, 
  onClearError, 
  onSubmitAuth 
}: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confPassword, setConfPassword] = useState('');
  const [localErr, setLocalErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    onClearError();

    if (!email || !password) {
      setLocalErr('Please enter both email and password.');
      return;
    }

    if (isRegister && password !== confPassword) {
      setLocalErr('Passwords do not match.');
      return;
    }

    onSubmitAuth(email, password, isRegister);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" id="login-screen-outer">
      <div 
        className="w-full max-w-md p-8 bg-brand-card rounded-2xl border border-brand-border shadow-xl transition-all"
        id="login-card-container"
      >
        <div className="flex flex-col items-center mb-8" id="login-header-group">
          <div className="p-3 bg-brand-primary/10 rounded-xl mb-4 text-brand-primary" id="login-logo-badge">
            <Zap className="w-8 h-8 filter drop-shadow-[0_2px_8px_var(--primary-color)]" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-brand-text tracking-tight text-center">
            {isRegister ? 'Create Contractor Account' : 'Contractor Portal'}
          </h2>
          <p className="text-sm text-brand-muted text-center mt-1">
            {isRegister 
              ? 'Sign up to generate and manage compliance drafts' 
              : 'Log in to access your AS/NZS compliance scheduler'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" id="login-form-element">
          {(errorMsg || localErr) && (
            <div 
              className="p-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs" 
              id="login-error-alert"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localErr || errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
              Email Address / Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-brand-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                placeholder="electrician@contractor.com.au"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-brand-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-confirm-password-input"
                  type="password"
                  value={confPassword}
                  onChange={(e) => setConfPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  placeholder="••••••••"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-brand-primary hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all font-sans"
          >
            {isLoading ? 'Processing Access...' : (isRegister ? 'Register Account' : 'Log In Securely')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-brand-border text-center" id="login-switch-action-container">
          <button
            id="login-toggle-signup-mode"
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalErr(null);
              onClearError();
            }}
            className="text-xs font-medium text-brand-primary hover:underline focus:outline-none block w-full text-center mb-4"
          >
            {isRegister 
              ? 'Already registered? Log in here' 
              : 'Need an account? Sign up here as subcontractor'
            }
          </button>

          <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 text-center mt-2 animate-fade-in" id="demo-account-container">
            <p className="text-xs text-brand-text mb-2 font-medium">
              Want to see preloaded compliance drafts?
            </p>
            <button
              id="login-btn-demo"
              type="button"
              onClick={() => {
                onSubmitAuth("demo@asnzs.com.au", "demo123", false);
              }}
              className="w-full py-2.5 px-3 bg-brand-primary text-white hover:opacity-95 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 filter drop-shadow" />
              Check demo account for 3 proposals
            </button>
            <p className="text-[10px] text-brand-muted mt-1.5 leading-tight">
              Instant bypass login with Proposal #1: Switchboard, Proposal #2: Solar, & Proposal #3: Lighting pre-configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
