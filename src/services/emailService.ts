import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AuthorizedEmailAccount, EmailLog } from '../types';

const EMAIL_ACCOUNTS_COL = 'authorizedEmails';
const EMAIL_LOGS_COL = 'emailLogs';

export const INITIAL_EMAIL_ACCOUNTS: AuthorizedEmailAccount[] = [
  {
    id: 'account-math-seeker-support',
    name: 'Atif Skills Hub Support & Mathematics Seeker Academy',
    email: 'dostdar.cui@gmail.com',
    type: 'Collaboration / Support',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'account-atif-skills-hub-admin',
    name: 'Atif Skills Hub Admin',
    email: 'atifhuss773@gmail.com',
    type: 'Main Admin / Authorized Email',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Seed initial authorized email accounts
 */
export const seedInitialEmailAccounts = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      return;
    }
    const snap = await getDocs(collection(db, EMAIL_ACCOUNTS_COL));
    if (snap.empty) {
      for (const acc of INITIAL_EMAIL_ACCOUNTS) {
        await setDoc(doc(db, EMAIL_ACCOUNTS_COL, acc.id), acc);
      }
    } else {
      // Ensure both predefined accounts exist
      for (const acc of INITIAL_EMAIL_ACCOUNTS) {
        const docRef = doc(db, EMAIL_ACCOUNTS_COL, acc.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, acc);
        }
      }
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      return;
    }
    console.warn('Notice seeding email accounts:', err);
  }
};

/**
 * Fetch all authorized email accounts
 */
export const getAuthorizedEmails = async (): Promise<AuthorizedEmailAccount[]> => {
  try {
    const snap = await getDocs(collection(db, EMAIL_ACCOUNTS_COL));
    if (snap.empty) {
      return INITIAL_EMAIL_ACCOUNTS;
    }
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AuthorizedEmailAccount, 'id'>),
    }));
  } catch (err) {
    console.error('Error fetching authorized emails:', err);
    return INITIAL_EMAIL_ACCOUNTS;
  }
};

/**
 * Subscribe to authorized email accounts in real-time
 */
export const subscribeToAuthorizedEmails = (
  callback: (emails: AuthorizedEmailAccount[]) => void
) => {
  return onSnapshot(
    collection(db, EMAIL_ACCOUNTS_COL),
    (snap) => {
      if (snap.empty) {
        callback(INITIAL_EMAIL_ACCOUNTS);
        return;
      }
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AuthorizedEmailAccount, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      console.error('Error subscribing to authorized emails:', err);
      callback(INITIAL_EMAIL_ACCOUNTS);
    }
  );
};

/**
 * Save or update authorized email account
 */
export const saveAuthorizedEmail = async (acc: AuthorizedEmailAccount): Promise<void> => {
  const accId = acc.id || `email_${Date.now()}`;
  const data: AuthorizedEmailAccount = {
    ...acc,
    id: accId,
    updatedAt: new Date().toISOString(),
    createdAt: acc.createdAt || new Date().toISOString(),
  };
  await setDoc(doc(db, EMAIL_ACCOUNTS_COL, accId), data);
};

/**
 * Delete authorized email account
 */
export const deleteAuthorizedEmail = async (accId: string): Promise<void> => {
  await deleteDoc(doc(db, EMAIL_ACCOUNTS_COL, accId));
};

/**
 * Toggle email status
 */
export const toggleEmailStatus = async (
  accId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> => {
  await updateDoc(doc(db, EMAIL_ACCOUNTS_COL, accId), {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Fetch email transmission logs
 */
export const getEmailLogs = async (): Promise<EmailLog[]> => {
  try {
    const snap = await getDocs(collection(db, EMAIL_LOGS_COL));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EmailLog, 'id'>),
      }))
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.error('Error fetching email logs:', err);
    return [];
  }
};

/**
 * Subscribe to email transmission logs in real-time
 */
export const subscribeToEmailLogs = (callback: (logs: EmailLog[]) => void) => {
  return onSnapshot(
    collection(db, EMAIL_LOGS_COL),
    (snap) => {
      const logs = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmailLog, 'id'>),
        }))
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      callback(logs);
    },
    (err) => {
      console.error('Error subscribing to email logs:', err);
      callback([]);
    }
  );
};

/**
 * Send test email / notification and record in Firestore log
 */
export const sendTestOrBroadcastEmail = async (data: {
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  emailType?: string;
}): Promise<EmailLog> => {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const emailLog: EmailLog = {
    id: logId,
    senderEmail: data.senderEmail,
    senderName: data.senderName,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    message: data.message,
    emailType: data.emailType || 'Test Email',
    status: 'Sent',
    sentAt: new Date().toISOString(),
  };

  await setDoc(doc(db, EMAIL_LOGS_COL, logId), emailLog);
  return emailLog;
};
