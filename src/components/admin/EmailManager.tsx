import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Send,
  History,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Info,
  Check,
  Copy,
  UserCheck,
  RotateCcw,
  Sparkles,
  Lock,
  Eye,
  X,
  Save,
} from 'lucide-react';
import { AuthorizedEmailAccount, EmailLog } from '../../types';
import {
  getAuthorizedEmails,
  saveAuthorizedEmail,
  deleteAuthorizedEmail,
  toggleEmailStatus,
  subscribeToAuthorizedEmails,
  subscribeToEmailLogs,
  sendTestOrBroadcastEmail,
} from '../../services/emailService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const EmailManager: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [accounts, setAccounts] = useState<AuthorizedEmailAccount[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'accounts' | 'compose' | 'history'>('accounts');

  // Search & Copy
  const [search, setSearch] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Account Modal State
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<AuthorizedEmailAccount>>({
    name: '',
    email: '',
    type: 'Collaboration / Support',
    status: 'active',
  });

  // Compose State
  const [composeData, setComposeData] = useState({
    senderEmail: 'atifhuss773@gmail.com',
    senderName: 'Atif Skills Hub Admin',
    recipientEmail: 'dostdar.cui@gmail.com',
    subject: 'Atif Skills Hub: Welcome to Academic Collaboration',
    message:
      'Greetings from Atif Skills Hub.\n\nThis is a verified institutional message to confirm the active academic collaboration with Atif Skills Hub Support & Mathematics Seeker Academy.\n\nOur shared goal is to deliver world-class learning resources, mathematics mentorship, and data science certifications to all learners.\n\nBest regards,\nDirector of Learning, Atif Skills Hub',
    emailType: 'Test Email',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubAccounts = subscribeToAuthorizedEmails((data) => {
      setAccounts(data);
      if (data.length > 0 && !composeData.senderEmail) {
        setComposeData((prev) => ({
          ...prev,
          senderEmail: data[0].email,
          senderName: data[0].name,
        }));
      }
      setLoading(false);
    });

    const unsubLogs = subscribeToEmailLogs((data) => {
      setLogs(data);
    });

    return () => {
      unsubAccounts();
      unsubLogs();
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleOpenAddAccount = () => {
    setEditingAccount({
      name: '',
      email: '',
      type: 'Collaboration / Support',
      status: 'active',
    });
    setAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: AuthorizedEmailAccount) => {
    setEditingAccount({ ...acc });
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount.name || !editingAccount.email) {
      error('Validation', 'Account name and email address are required.');
      return;
    }

    try {
      const toSave: AuthorizedEmailAccount = {
        id: editingAccount.id || `email_${Date.now()}`,
        name: editingAccount.name.trim(),
        email: editingAccount.email.trim(),
        type: editingAccount.type || 'Collaboration / Support',
        status: (editingAccount.status as 'active' | 'inactive') || 'active',
        updatedAt: new Date().toISOString(),
        createdAt: editingAccount.createdAt || new Date().toISOString(),
      };

      await saveAuthorizedEmail(toSave);
      success('Email Saved', `Authorized email "${toSave.email}" saved.`);
      setAccountModalOpen(false);
      setEditingAccount({ name: '', email: '', type: 'Collaboration / Support', status: 'active' });
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save email account to Firestore.');
    }
  };

  const handleDeleteAccount = async (acc: AuthorizedEmailAccount) => {
    if (confirm(`Remove authorized email account "${acc.email}"?`)) {
      try {
        await deleteAuthorizedEmail(acc.id);
        success('Account Removed', `Removed ${acc.email}`);
      } catch (err) {
        console.error(err);
        error('Delete Failed', 'Failed to remove email.');
      }
    }
  };

  const handleToggleStatus = async (acc: AuthorizedEmailAccount) => {
    const nextStatus = acc.status === 'active' ? 'inactive' : 'active';
    try {
      await toggleEmailStatus(acc.id, nextStatus);
      success('Status Updated', `Email account ${acc.email} is now ${nextStatus}.`);
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to update status.');
    }
  };

  const handleQuickSendTo = (acc: AuthorizedEmailAccount) => {
    setComposeData((prev) => ({
      ...prev,
      recipientEmail: acc.email,
      subject: `Direct Notice to ${acc.name}`,
    }));
    setSubTab('compose');
  };

  const handleSelectSender = (email: string) => {
    const found = accounts.find((a) => a.email === email);
    setComposeData((prev) => ({
      ...prev,
      senderEmail: email,
      senderName: found ? found.name : 'Authorized Sender',
    }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.recipientEmail || !composeData.subject || !composeData.message) {
      error('Validation Error', 'Recipient, Subject, and Message are required.');
      return;
    }

    setSending(true);
    try {
      await sendTestOrBroadcastEmail({
        senderEmail: composeData.senderEmail,
        senderName: composeData.senderName,
        recipientEmail: composeData.recipientEmail.trim(),
        subject: composeData.subject.trim(),
        message: composeData.message.trim(),
        emailType: composeData.emailType,
      });

      success(
        'Email Dispatched',
        `Successfully logged & sent "${composeData.subject}" from ${composeData.senderEmail} to ${composeData.recipientEmail}.`
      );
      setSubTab('history');
    } catch (err) {
      console.error(err);
      error('Dispatch Failed', 'Could not record or send email transmission.');
    } finally {
      setSending(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner with Security Architecture Notice */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                Institutional Email Accounts
              </span>
              <span className="text-xs text-slate-400">Zero Password Storage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Mail className="w-6 h-6 text-amber-400" /> Authorized Email Accounts & Transmission
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Manage authorized communication channels, configure sender identities, send test emails, and audit transmission logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('compose')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform"
            >
              <Send className="w-4 h-4" /> Compose &amp; Send Test Email
            </button>
            <button
              onClick={handleOpenAddAccount}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Add Account
            </button>
          </div>
        </div>

        {/* Security / RBAC Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-300">
            <p className="font-bold text-amber-300">
              Security Architecture &amp; Access Control Notice
            </p>
            <p className="text-slate-300 leading-relaxed">
              Email addresses stored in this roster represent authorized communication and partner support identities. <strong>No passwords are stored or displayed</strong>. Adding an email here does <em>not</em> grant unauthorized Firebase Auth dashboard access without verified Firebase Authentication role authorization.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            subTab === 'accounts'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Authorized Accounts ({accounts.length})
        </button>

        <button
          onClick={() => setSubTab('compose')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            subTab === 'compose'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" /> Compose / Send Email
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            subTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" /> Transmission History ({logs.length})
        </button>
      </div>

      {/* SUBTAB 1: ACCOUNTS ROSTER */}
      {subTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search authorized emails..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              Showing {filteredAccounts.length} authorized account(s)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-4 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                          {acc.type}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{acc.name}</h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(acc)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        acc.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {acc.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email address box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Authorized Address</span>
                      <p className="text-xs font-mono font-bold text-amber-300 select-all">{acc.email}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(acc.email)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 text-xs"
                      title="Copy email"
                    >
                      {copiedEmail === acc.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleQuickSendTo(acc)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditAccount(acc)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: COMPOSE & SEND EMAIL */}
      {subTab === 'compose' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" /> Dispatch Test / Official Notification Email
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select an authorized sender identity to transmit messages and record them to the verifiable audit trail.
            </p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Send From (Authorized Identity) *
                </label>
                <select
                  value={composeData.senderEmail}
                  onChange={(e) => handleSelectSender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.email}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Category</label>
                <select
                  value={composeData.emailType}
                  onChange={(e) => setComposeData({ ...composeData, emailType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="Test Email">Test Email / Ping</option>
                  <option value="Collaboration Notice">Collaboration Notice</option>
                  <option value="Support Response">Support Response</option>
                  <option value="Course Announcement">Course Announcement</option>
                  <option value="Platform Security">Platform Security</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Recipient Email Address *
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  value={composeData.recipientEmail}
                  onChange={(e) =>
                    setComposeData({ ...composeData, recipientEmail: e.target.value })
                  }
                  required
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setComposeData({ ...composeData, recipientEmail: 'dostdar.cui@gmail.com' })
                    }
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-amber-300 hover:text-amber-200"
                  >
                    dostdar.cui@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setComposeData({ ...composeData, recipientEmail: 'atifhuss773@gmail.com' })
                    }
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-blue-300 hover:text-blue-200"
                  >
                    atifhuss773@gmail.com
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Subject *</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                required
                placeholder="Enter email subject line..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Message Body *</label>
              <textarea
                value={composeData.message}
                onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                required
                rows={6}
                placeholder="Write your email contents here..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs leading-relaxed font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubTab('accounts')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-900/30 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {sending ? 'Transmitting...' : 'Send & Record Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: TRANSMISSION HISTORY */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" /> Verifiable Email Transmission Audit Trail
            </h3>
            <span className="text-xs text-slate-400 font-mono">{logs.length} Total Logs</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No Transmission Logs Yet</p>
              <p className="text-xs text-slate-500">
                Use the &quot;Compose &amp; Send&quot; tab to dispatch your first test message.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono uppercase">
                        {log.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
                        {log.emailType}
                      </span>
                      <h4 className="text-sm font-bold text-white">{log.subject}</h4>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(log.sentAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">From</span>
                      <p className="font-bold text-slate-200">
                        {log.senderName} <span className="font-mono font-normal text-amber-400">({log.senderEmail})</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">To</span>
                      <p className="font-mono font-bold text-blue-300 select-all">
                        {log.recipientEmail}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT AUTHORIZED EMAIL ACCOUNT */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                {editingAccount.id ? 'Edit Authorized Email' : 'Add Authorized Email Account'}
              </h2>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Account Display Name / Holder *
                </label>
                <input
                  type="text"
                  value={editingAccount.name || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  required
                  placeholder="e.g. Atif Skills Hub Support & Mathematics Seeker Academy"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editingAccount.email || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                  required
                  placeholder="e.g. dostdar.cui@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Account Role / Type</label>
                  <select
                    value={editingAccount.type || 'Collaboration / Support'}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, type: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="Collaboration / Support">Collaboration / Support</option>
                    <option value="Main Admin / Authorized Email">Main Admin / Authorized Email</option>
                    <option value="Academic Support">Academic Support</option>
                    <option value="Admissions & Registrar">Admissions &amp; Registrar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editingAccount.status || 'active'}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
                Passwords are not stored. Adding this account configures sender identity and routing only.
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
