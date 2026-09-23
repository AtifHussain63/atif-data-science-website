import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface StoredCredential {
  email: string;
  passwordHash: string; // Plain/hashed password for local authentication verification
  name: string;
  role: 'admin' | 'student';
  studentId: string;
  phone?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ash_registered_accounts';

/**
 * Initial Default Accounts with secure pre-set passwords
 */
const DEFAULT_ACCOUNTS: Record<string, StoredCredential> = {
  'atifhuss773@gmail.com': {
    email: 'atifhuss773@gmail.com',
    passwordHash: 'Admin@123456',
    name: 'Atif Hussain',
    role: 'admin',
    studentId: 'ASH-ADM-00001',
    phone: '+92 300 0000000',
    country: 'Pakistan',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  'dostdar.cui@gmail.com': {
    email: 'dostdar.cui@gmail.com',
    passwordHash: 'Partner@123456',
    name: 'Dostdar',
    role: 'admin',
    studentId: 'ASH-ADM-00002',
    phone: '',
    country: 'Pakistan',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  'student.demo@atifskillshub.org': {
    email: 'student.demo@atifskillshub.org',
    passwordHash: 'Student@123456',
    name: 'Demo Student',
    role: 'student',
    studentId: 'ASH-STU-00001',
    phone: '',
    country: 'Global',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
};

/**
 * Load all registered credentials from localStorage + defaults
 */
export const getAllStoredAccounts = (): Record<string, StoredCredential> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return { ...DEFAULT_ACCOUNTS };
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ACCOUNTS, ...parsed };
  } catch (e) {
    console.warn('Could not read stored accounts from localStorage', e);
    return { ...DEFAULT_ACCOUNTS };
  }
};

/**
 * Get account by email
 */
export const getStoredAccount = (email: string): StoredCredential | null => {
  const clean = email.trim().toLowerCase();
  const all = getAllStoredAccounts();
  return all[clean] || null;
};

/**
 * Save or update an account with its password
 */
export const saveAccountCredential = async (
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'student' = 'student',
  phone = '',
  country = 'Global',
  studentId?: string
): Promise<StoredCredential> => {
  const clean = email.trim().toLowerCase();
  const all = getAllStoredAccounts();

  const isExisting = all[clean];
  const sId =
    studentId ||
    isExisting?.studentId ||
    (role === 'admin'
      ? clean === 'atifhuss773@gmail.com'
        ? 'ASH-ADM-00001'
        : 'ASH-ADM-00002'
      : `ASH-STU-${Math.floor(10000 + Math.random() * 90000)}`);

  const updated: StoredCredential = {
    email: clean,
    passwordHash: password,
    name: name || isExisting?.name || clean.split('@')[0],
    role,
    studentId: sId,
    phone: phone || isExisting?.phone || '',
    country: country || isExisting?.country || 'Global',
    createdAt: isExisting?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all[clean] = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Could not write to localStorage', e);
  }

  // Also sync asynchronously to Firestore
  try {
    const credRef = doc(db, 'accountSecurity', clean.replace(/[^a-zA-Z0-9]/g, '_'));
    await setDoc(
      credRef,
      {
        email: clean,
        name: updated.name,
        role: updated.role,
        studentId: updated.studentId,
        passwordHash: updated.passwordHash,
        updatedAt: updated.updatedAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync credential to Firestore:', err);
  }

  return updated;
};

/**
 * Set or reset password for an email
 */
export const setAccountPassword = async (email: string, newPassword: string): Promise<StoredCredential> => {
  const clean = email.trim().toLowerCase();
  const existing = getStoredAccount(clean);

  const isAtif = clean === 'atifhuss773@gmail.com';
  const isDostdar = clean === 'dostdar.cui@gmail.com';
  const role = isAtif || isDostdar ? 'admin' : (existing?.role || 'student');
  const name = existing?.name || (isAtif ? 'Atif Hussain' : isDostdar ? 'Dostdar' : clean.split('@')[0]);

  return saveAccountCredential(clean, newPassword, name, role, existing?.phone, existing?.country, existing?.studentId);
};

/**
 * Strict Password Verification Engine:
 * Returns success ONLY if account exists AND password strictly matches!
 */
export const verifyAccountCredentials = async (
  email: string,
  enteredPassword: string
): Promise<{ success: boolean; error?: string; account?: StoredCredential }> => {
  const clean = email.trim().toLowerCase();

  // Try checking from Firestore if local not found
  let account = getStoredAccount(clean);

  if (!account) {
    try {
      const credRef = doc(db, 'accountSecurity', clean.replace(/[^a-zA-Z0-9]/g, '_'));
      const snap = await getDoc(credRef);
      if (snap.exists()) {
        account = snap.data() as StoredCredential;
        // cache in local
        const all = getAllStoredAccounts();
        all[clean] = account;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }
    } catch (e) {
      console.warn('Could not fetch credential from Firestore', e);
    }
  }

  if (!account) {
    return {
      success: false,
      error: `No registered account found for "${clean}". Please click "Create Account / Set Password" first to set your password.`,
    };
  }

  if (account.passwordHash !== enteredPassword) {
    return {
      success: false,
      error: 'Incorrect password! Please enter the exact password you set, or use the "Set / Reset Password" tab to change it.',
    };
  }

  return {
    success: true,
    account,
  };
};
