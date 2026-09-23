import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPageProps {
  initialTab?: 'login' | 'register' | 'forgot';
  onNavigate: (view: string, param?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'login', onNavigate }) => {
  const {
    user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    setUserPassword,
  } = useAuth();
  const { success, error, info } = useToast();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      if (isAuthorizedAdminEmail(user.email)) {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your registered email and password.');
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email.trim(), password);
      success('Welcome Back!', 'Logged in successfully.');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Invalid email or password.';
      setErrorMessage(msg);
      error('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields (Name, Email, and Password).');
      error('Missing Fields', 'Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      error('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password carefully.');
      error('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await registerWithEmail(email.trim(), password, name.trim(), phone.trim(), country.trim());
      success('Account & Password Created!', 'Your account has been registered with your custom password.');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Could not complete registration.';
      setErrorMessage(msg);
      error('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDirectPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await setUserPassword(email.trim(), password);
      await resetPassword(email.trim());
      success('Password Updated!', `New password has been saved for ${email.trim()}. You can now log in.`);
      setTab('login');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Could not set new password.';
      setErrorMessage(msg);
      error('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await loginWithGoogle();
      success('Google Sign-In', 'Signed in with Google account successfully.');
    } catch (err: any) {
      console.error(err);
      error('Sign-in Failed', err.message || 'Could not complete Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  // Demo helper fills
  const fillAdmin = () => {
    setEmail('atifhuss773@gmail.com');
    setPassword('Admin@123456');
    setConfirmPassword('Admin@123456');
    setErrorMessage(null);
    setTab('login');
  };

  const fillPartner = () => {
    setEmail('dostdar.cui@gmail.com');
    setPassword('Partner@123456');
    setConfirmPassword('Partner@123456');
    setErrorMessage(null);
    setTab('login');
  };

  const fillDemoStudent = () => {
    setEmail('student.demo@atifskillshub.org');
    setPassword('Student@123456');
    setConfirmPassword('Student@123456');
    setErrorMessage(null);
    setTab('login');
  };

  return (
    <div id="auth-page" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-900/30">
            A
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Atif Skills Hub</h1>
          <p className="text-xs text-slate-400">Data Science & AI Learning & Certification Platform</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            id="tab-btn-login"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Sign In
          </button>
          <button
            id="tab-btn-register"
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Set Password / Register
          </button>
          <button
            id="tab-btn-forgot"
            onClick={() => {
              setTab('forgot');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'forgot'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Reset Password
          </button>
        </div>

        {/* Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Error / Alert Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">{errorMessage}</p>
                {errorMessage.includes('does not exist') && (
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-[11px] font-bold text-amber-400 underline hover:text-amber-300 block"
                  >
                    Click here to Set Your Password & Register →
                  </button>
                )}
                {errorMessage.includes('Incorrect password') && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] font-bold text-amber-400 underline hover:text-amber-300 block"
                  >
                    Forgot Password? Click here to Reset / Set New Password →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address
                </label>
                <input
                  id="input-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  placeholder="e.g. atifhuss773@gmail.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Forgot / Reset?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    required
                    placeholder="Enter your exact password"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" /> {loading ? 'Verifying Credentials...' : 'Sign In with Password'}
              </button>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
                <span>Pehli baar login kar rahe hain?</span>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-bold text-amber-400 hover:underline"
                >
                  Pehle Password Set Karein →
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER & SET PASSWORD */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                ✨ <strong>Set Your Custom Password:</strong> Create your account with your own private password.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Full Name
                </label>
                <input
                  id="input-register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Atif Hussain / Dostdar / Student Name"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address
                </label>
                <input
                  id="input-register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. dostdar.cui@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Set Password (Apna Password Rakhein)
                </label>
                <div className="relative">
                  <input
                    id="input-register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Apna password likhein (min 6 characters)"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Confirm Password
                </label>
                <input
                  id="input-register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Password dobara likhein"
                  className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[10px] text-rose-400 mt-1 block">Passwords match nahi ho rahe</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" /> Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Pakistan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" /> {loading ? 'Saving Password & Creating Account...' : 'Set Password & Register'}
              </button>
            </form>
          )}

          {/* TAB 3: RESET / SET DIRECT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleSetDirectPassword} className="space-y-4">
              <div>
                <p className="text-xs text-slate-300 mb-2">
                  Agar aap password bhool gaye hain ya naya password lagana chahte hain, to yahan se <strong>foran apna naya password</strong> set kar sakte hain:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Naya Password Set Karein
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Naya password likhein"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Confirm Naya Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Naya password dobara likhein"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
              >
                <KeyRound className="w-4 h-4" /> {loading ? 'Saving New Password...' : 'Save & Set New Password'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* Social Sign In */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.9 7.4C.7 9.8 0 12.4 0 15.2s.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Quick Pre-filled Logins with Configured Passwords */}
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider text-center font-bold mb-2">
              Default Configured Passwords (Strict Password Checking Enabled)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={fillAdmin}
                className="py-2 px-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 rounded-lg text-[10px] text-amber-400 font-bold truncate text-center"
                title="Founder Admin: atifhuss773@gmail.com (Password: Admin@123456)"
              >
                👑 Atif (Admin)
              </button>
              <button
                type="button"
                onClick={fillPartner}
                className="py-2 px-1.5 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 rounded-lg text-[10px] text-indigo-300 font-bold truncate text-center"
                title="Partner / Support: dostdar.cui@gmail.com (Password: Partner@123456)"
              >
                🤝 Dostdar (Partner)
              </button>
              <button
                type="button"
                onClick={fillDemoStudent}
                className="py-2 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 font-medium truncate text-center"
                title="Demo Student: student.demo@atifskillshub.org (Password: Student@123456)"
              >
                🎓 Student
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Strict password verification is active. Galat password enter karne par login reject hoga.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

