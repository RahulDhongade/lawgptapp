import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, KeyRound, AlertCircle, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verify2fa, setup2fa, confirmSetup2fa } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa' | 'setup_2fa'>('credentials');
  const [pendingToken, setPendingToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretText, setSecretText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.pending2faToken) {
        setPendingToken(res.pending2faToken);
      }

      if (res.require2fa) {
        setStep('2fa');
      } else if (res.require2faSetup && res.pending2faToken) {
        // Fetch QR code for enrollment
        const setupData = await setup2fa(res.pending2faToken);
        setQrCodeUrl(setupData.qrCodeUrl);
        setSecretText(setupData.secret);
        setStep('setup_2fa');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (step === '2fa') {
        await verify2fa(pendingToken, code.trim());
      } else {
        await confirmSetup2fa(pendingToken, code.trim());
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid two-factor authentication code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface text-on-surface">
      <div className="w-full max-w-md bg-surface-container border border-surface-container-high rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-surface-container-highest border border-primary/40 flex items-center justify-center text-primary shadow-lg">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-on-surface">LawGPT Console</h1>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
            Operational Command &amp; Administration
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-3 text-error text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Credentials Form */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate.admin@lawgpt.in"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        )}

        {/* Step 2: 2FA Verification */}
        {step === '2fa' && (
          <form onSubmit={handle2faVerify} className="space-y-4">
            <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high text-xs text-on-surface-variant text-center space-y-1">
              <p className="font-semibold text-on-surface">Authenticator Code Required</p>
              <p className="text-[11px]">Enter the 6-digit verification code from Google Authenticator or Authy.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-secondary" />
                6-Digit TOTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="flex-1 py-2.5 px-4 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:bg-surface-bright"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="flex-1 py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-sm transition-all shadow-md"
              >
                {isLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: First-time 2FA Enrollment */}
        {step === 'setup_2fa' && (
          <form onSubmit={handle2faVerify} className="space-y-4">
            <div className="p-3 bg-surface-container-low rounded-lg border border-primary/20 text-xs text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-primary font-semibold">
                <QrCode className="w-4 h-4" />
                <span>Enroll Authenticator (Mandatory)</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Scan this QR code with your authenticator app to enable Two-Factor Authentication.
              </p>
              {qrCodeUrl && (
                <div className="flex justify-center p-2 bg-white rounded-lg max-w-[160px] mx-auto shadow">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-36 h-36" />
                </div>
              )}
              <p className="font-mono text-[10px] text-outline break-all select-all">
                Manual Key: {secretText}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Enter Code from Authenticator to Confirm:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-sm transition-all shadow-md"
            >
              {isLoading ? 'Confirming...' : 'Activate & Enter Console'}
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-outline pt-2 border-t border-surface-container-high">
          Secured by LawGPT Identity Gateway • Zero Default Credentials
        </div>
      </div>
    </div>
  );
};
