import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Globe,
  Shield,
  Key,
  Save,
  CheckCircle2,
  Palette,
  LogOut,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface ProfilePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, profile, updateUserProfile, resetPassword, setUserPassword, isAdmin, logout } =
    useAuth();
  const { success, error, info } = useToast();

  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [country, setCountry] = useState(profile?.country || 'Global');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Direct Password Update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged Out', 'You have been signed out successfully.');
      onNavigate('home');
    } catch (err: any) {
      error('Logout Failed', err?.message || 'Could not log out.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Full Name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        country: country.trim(),
      });
      success('Profile Updated', 'Your profile details have been saved.');
    } catch (err) {
      console.error(err);
      error('Update Failed', 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      error('Error', 'No authenticated user found.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      error('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      error('Password Mismatch', 'New passwords do not match.');
      return;
    }

    try {
      setIsChangingPass(true);
      await setUserPassword(user.email, newPassword);
      success('Password Saved', 'Your new password has been set successfully! Next time you login, use this password.');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error(err);
      error('Failed to change password', err?.message || 'Could not update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setSendingReset(true);
      await resetPassword(user.email);
      success('Password Reset Email Sent', `Sent instructions to ${user.email}`);
    } catch (err) {
      console.error(err);
      error('Reset Failed', 'Could not send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div id="profile-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Account Settings</p>
          <h1 className="text-3xl font-extrabold text-white mt-1">Student Profile</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage your account information, custom password, and credentials.</p>
        </div>

        {/* Profile Card Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Top user ID badge */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-900/30">
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{name || 'Student'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                  {profile?.studentId || 'ASH-STU-00001'}
                </span>
                <span className="text-xs text-slate-400 font-medium">Role: {profile?.role || 'student'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> Full Name
              </label>
              <input
                id="input-profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Email is permanently linked to your student credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number (optional)
                </label>
                <input
                  id="input-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Country
                </label>
                <input
                  id="input-profile-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, Pakistan, UK"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-save-profile"
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-900/20"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>

          {/* Change / Set Custom Password Section */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Set / Change Account Password
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Apna pasandeeda password yahan set karein taakay aglay login par sirf yahi password use ho.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Naya Password (New Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Confirm Naya Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Password update hone ke baad strict login enforce hoga.
                </span>
                <button
                  type="submit"
                  disabled={isChangingPass || !newPassword}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40 transition-colors"
                >
                  {isChangingPass ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Appearance & Theme Preference */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" /> Interface Appearance (Dark / Light)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Choose your preferred visual theme</p>
            </div>
            <ThemeToggle variant="segmented" />
          </div>

          {/* Security & Password reset email */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Email Reset Link
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Send a secure reset link to your email inbox</p>
            </div>

            <button
              id="btn-reset-password-profile"
              onClick={handlePasswordReset}
              disabled={sendingReset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
            >
              {sendingReset ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          {/* Account Session & Sign Out */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out of Account
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Log out of this device session safely</p>
            </div>

            <button
              id="btn-logout-profile"
              onClick={handleLogout}
              className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

