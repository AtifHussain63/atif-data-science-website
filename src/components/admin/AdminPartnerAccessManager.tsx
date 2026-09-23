import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  Key,
  Mail,
  Lock,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, isAuthorizedAdminEmail } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminPartnerAccessManager: React.FC = () => {
  const { user, partnerAdminEmail, updatePartnerAdminEmail, setUserPassword } = useAuth();
  const { success, error, info } = useToast();

  const [inputEmail, setInputEmail] = useState(partnerAdminEmail || 'dostdar.cui@gmail.com');
  const [isSaving, setIsSaving] = useState(false);
  const [checkEmailQuery, setCheckEmailQuery] = useState('');
  const [checkResult, setCheckResult] = useState<{ checked: boolean; isAdmin: boolean; email: string } | null>(null);

  // Admin password setter state
  const [targetAdminEmail, setTargetAdminEmail] = useState(user?.email || 'atifhuss773@gmail.com');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [isSettingAdminPass, setIsSettingAdminPass] = useState(false);

  const handleUpdatePartnerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      error('Invalid Email', 'Please enter a valid partner email address.');
      return;
    }

    try {
      setIsSaving(true);
      await updatePartnerAdminEmail(clean);
      success('Partner Access Granted', `Admin access granted to ${clean}. Only you and this partner can access the Admin Panel.`);
    } catch (err) {
      console.error(err);
      error('Update Failed', 'Could not update partner email.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = targetAdminEmail.trim().toLowerCase();
    if (!isAuthorizedAdminEmail(clean)) {
      error('Permission Denied', 'This email is not an authorized Executive Admin.');
      return;
    }

    if (!adminNewPassword || adminNewPassword.length < 6) {
      error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      error('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setIsSettingAdminPass(true);
      await setUserPassword(clean, adminNewPassword);
      success('Admin Password Updated!', `Custom password saved for ${clean}. Only this exact password will be allowed for login.`);
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      error('Update Failed', err?.message || 'Could not update admin password.');
    } finally {
      setIsSettingAdminPass(false);
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = checkEmailQuery.trim().toLowerCase();
    if (!clean) return;
    const authorized = isAuthorizedAdminEmail(clean);
    setCheckResult({ checked: true, isAdmin: authorized, email: clean });
  };

  const isCurrentFounder = user?.email?.toLowerCase() === 'atifhuss773@gmail.com';
  const isCurrentPartner = user?.email?.toLowerCase() === partnerAdminEmail?.toLowerCase() || user?.email?.toLowerCase() === 'dostdar.cui@gmail.com';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                STRICT DUAL-ADMIN ENFORCEMENT
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Locked
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Founder & Partner Exclusive Admin Access
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              As per your strict directive, only <strong>Atif Hussain (Founder)</strong> and your <strong>Official Partner</strong> can log in and access this Executive Control Hub. All other user accounts and emails are strictly prevented from gaining admin permissions.
            </p>
          </div>
        </div>

        {/* Current Active User Badge */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl shrink-0 flex flex-col gap-1 text-right">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Currently Logged In As</span>
          <span className="text-xs font-bold text-amber-400">{user?.email || 'Authenticated User'}</span>
          <span className="text-[11px] font-semibold text-indigo-400">
            {isCurrentFounder ? '👑 Founder & Director' : isCurrentPartner ? '🤝 Authorized Partner Admin' : 'Admin'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: The Two Authorized Admins */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" /> Authorized Admin Accounts (Only 2)
          </h3>

          {/* Admin 1: Founder */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Atif Hussain</span>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                    Primary Founder & Owner
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">atifhuss773@gmail.com</div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              Permanent
            </span>
          </div>

          {/* Admin 2: Partner / Support */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                🤝
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Dostdar</span>
                  <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                    Partner / Support Co-Admin
                  </span>
                </div>
                <div className="text-xs text-indigo-300 font-mono mt-0.5">{partnerAdminEmail || 'dostdar.cui@gmail.com'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Mathematics & Seeker Academy / Support Partner</div>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
              Active Partner
            </span>
          </div>

          {/* Strict Security Policy Note */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200/90 leading-relaxed">
              <strong className="text-rose-300 font-bold">Strict Lockdown:</strong> Anyone registering with other emails (including student accounts or generic admin addresses) is automatically classified as a student. They cannot enter or view this panel.
            </div>
          </div>
        </div>

        {/* Card 2: Partner Email Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" /> Manage Partner Admin Email
          </h3>

          <form onSubmit={handleUpdatePartnerEmail} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Partner Administrator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="e.g. dostdar.cui@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default: <span className="text-slate-400 font-mono">dostdar.cui@gmail.com</span> (Mathematics & Seeker Academy). When this user logs in with their password or Google sign-in, they will immediately be granted full Admin Dashboard access.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Access...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Save Partner Access
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInputEmail('dostdar.cui@gmail.com')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </form>

          {/* Admin Custom Password Setter Tool */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-amber-400 block flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Set / Update Admin Password (Atif or Partner)
            </label>
            <form onSubmit={handleSetAdminPassword} className="space-y-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Admin Account</label>
                <select
                  value={targetAdminEmail}
                  onChange={(e) => setTargetAdminEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="atifhuss773@gmail.com">👑 Atif Hussain (atifhuss773@gmail.com)</option>
                  <option value={partnerAdminEmail || 'dostdar.cui@gmail.com'}>
                    🤝 Dostdar Partner ({partnerAdminEmail || 'dostdar.cui@gmail.com'})
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Naya Admin Password</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      minLength={6}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showAdminPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Confirm Password</label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSettingAdminPass || !adminNewPassword}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-sm"
              >
                <Key className="w-3.5 h-3.5" /> {isSettingAdminPass ? 'Updating Password...' : 'Save Admin Password'}
              </button>
            </form>
          </div>

          {/* Quick Access Verification Test Tool */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-400 block">
              Quick Admin Permission Checker
            </label>
            <form onSubmit={handleVerifyEmail} className="flex gap-2">
              <input
                type="email"
                value={checkEmailQuery}
                onChange={(e) => setCheckEmailQuery(e.target.value)}
                placeholder="Enter an email to test permission..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700"
              >
                Check
              </button>
            </form>

            {checkResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  checkResult.isAdmin
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {checkResult.isAdmin ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-mono font-bold">{checkResult.email}</span>
                </div>
                <span className="font-bold">
                  {checkResult.isAdmin ? '✔ Full Executive Admin' : '❌ Access Denied (Student Only)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
