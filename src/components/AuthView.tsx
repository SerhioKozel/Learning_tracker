import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'signin' | 'signup' | 'reset';

export default function AuthView() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]               = useState<Tab>('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  const resetForm = (nextTab: Tab) => {
    setTab(nextTab);
    setError(null);
    setSuccess(null);
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        const err = await signIn(email, password);
        if (!err) navigate('/');
        else setError(err);

      } else if (tab === 'signup') {
        const err = await signUp(email, password);
        if (!err) {
          setSuccess('Account created! Check your email to confirm before signing in.');
        } else {
          setError(err);
        }

      } else {
        // reset
        const err = await resetPassword(email);
        if (!err) {
          setSuccess('Password reset link sent — check your inbox.');
        } else {
          setError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-11 w-11 rounded-xl bg-sky-500/10 border border-sky-500/20
                          flex items-center justify-center shadow-glow">
            <BookOpen className="h-5 w-5 text-sky-400" strokeWidth={2.2} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white">Learning Tracker</h1>
            <p className="text-xs text-ink-500 mt-0.5">Track what you learn</p>
          </div>
        </div>

        {/* Card */}
        <div className="surface rounded-2xl p-6 shadow-lift">

          {/* Tabs: sign in / sign up */}
          {tab !== 'reset' && (
            <div className="flex rounded-lg bg-ink-800 p-1 mb-6 gap-1">
              {(['signin', 'signup'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => resetForm(t)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    tab === t
                      ? 'bg-ink-900 text-white shadow-card'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {t === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
          )}

          {/* Reset password heading */}
          {tab === 'reset' && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white">Reset password</h2>
              <p className="text-xs text-ink-500 mt-1">
                Enter your email and we'll send a reset link.
              </p>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20
                            px-3 py-2.5 mb-4">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-px" />
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                            px-3 py-2.5 mb-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-px" />
              <p className="text-xs text-emerald-300">{success}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-9 pr-3 py-2
                             text-sm text-white placeholder:text-ink-600
                             focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60
                             transition-colors"
                />
              </div>
            </div>

            {/* Password — hidden on reset tab */}
            {tab !== 'reset' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === 'signup' ? 'At least 8 characters' : '••••••••'}
                    required
                    minLength={tab === 'signup' ? 8 : undefined}
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-9 pr-10 py-2
                               text-sm text-white placeholder:text-ink-600
                               focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60
                               transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300
                               transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === 'signin' && 'Sign in'}
              {tab === 'signup' && 'Create account'}
              {tab === 'reset'  && 'Send reset link'}
            </button>
          </div>

          {/* Footer links */}
          <div className="mt-5 flex flex-col items-center gap-2">
            {tab === 'signin' && (
              <button
                onClick={() => resetForm('reset')}
                className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
              >
                Forgot password?
              </button>
            )}
            {tab === 'reset' && (
              <button
                onClick={() => resetForm('signin')}
                className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-600 mt-6">
          Your data is private and only visible to you.
        </p>
      </div>
    </div>
  );
}
