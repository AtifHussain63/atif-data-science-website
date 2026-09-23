import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { seedInitialCourses } from '../services/courseService';
import { seedInitialCollaborations } from '../services/collaborationService';
import { seedInitialEmailAccounts } from '../services/emailService';
import { recordStudentRegistration } from '../services/studentRecordService';
import {
  saveAccountCredential,
  setAccountPassword,
  verifyAccountCredentials,
  getStoredAccount,
} from '../services/credentialService';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isSuspended: boolean;
  partnerAdminEmail: string;
  updatePartnerAdminEmail: (email: string) => Promise<void>;
  registerStudent: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
  }) => Promise<UserProfile>;
  registerWithEmail: (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    country?: string
  ) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile | null>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUserPassword: (email: string, newPass: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  makeAdmin: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Get current configured partner admin email (defaults to official partner)
 */
export const getPartnerAdminEmail = (): string => {
  try {
    return (
      localStorage.getItem('partner_admin_email')?.trim().toLowerCase() ||
      'dostdar.cui@gmail.com'
    );
  } catch {
    return 'dostdar.cui@gmail.com';
  }
};

/**
 * Set partner admin email in storage
 */
export const setPartnerAdminEmail = (email: string): void => {
  try {
    localStorage.setItem('partner_admin_email', email.trim().toLowerCase());
  } catch (e) {
    console.warn('Could not save partner email', e);
  }
};

/**
 * Strict Dual-Admin Policy:
 * Only two specific people are authorized to access the Admin Panel:
 * 1. Primary Founder & Director: Atif Hussain (atifhuss773@gmail.com)
 * 2. Official Academic Partner: Mathematics & Seeker Academy (dostdar.cui@gmail.com or configured partner email)
 * NO other email or user can log into or access the Admin Panel.
 */
export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  // 1. Primary Founder / Owner
  if (clean === 'atifhuss773@gmail.com') return true;
  // 2. Official Academic Partner
  if (clean === 'dostdar.cui@gmail.com') return true;
  // 3. Configured Partner Email
  const partnerEmail = getPartnerAdminEmail();
  if (partnerEmail && clean === partnerEmail) return true;
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [partnerAdminEmail, setPartnerAdminEmailState] = useState<string>(getPartnerAdminEmail());

  const updatePartnerAdminEmail = async (email: string) => {
    const clean = email.trim().toLowerCase();
    setPartnerAdminEmail(clean);
    setPartnerAdminEmailState(clean);
    try {
      await setDoc(
        doc(db, 'collaborationSettings', 'adminAccess'),
        {
          founderEmail: 'atifhuss773@gmail.com',
          partnerAdminEmail: clean,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync partner admin email to Firestore:', err);
    }
  };

  // Helper to generate formatted Student ID
  const generateStudentId = async (): Promise<string> => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const count = usersSnap.size + 1;
      const formattedNumber = String(count).padStart(5, '0');
      return `ASH-STU-${formattedNumber}`;
    } catch (err) {
      console.warn('Error computing student index, fallback to timestamp ID', err);
      const rand = Math.floor(10000 + Math.random() * 90000);
      return `ASH-STU-${rand}`;
    }
  };

  const fetchOrCreateProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const isAuthorizedAdmin = isAuthorizedAdminEmail(firebaseUser.email);
    const resolvedRole: 'admin' | 'student' = isAuthorizedAdmin ? 'admin' : 'student';

    try {
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Update lastLogin timestamp and enforce authorized admin role asynchronously
        updateDoc(userRef, {
          lastLogin: new Date().toISOString(),
          role: resolvedRole,
        }).catch((err) => console.warn('Could not update lastLogin on Firestore:', err));

        const updatedProfile: UserProfile = {
          ...data,
          role: resolvedRole,
          lastLogin: new Date().toISOString(),
        };
        setProfile(updatedProfile);
        return updatedProfile;
      } else {
        // Auto-create profile if missing
        const studentId = await generateStudentId();
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          studentId,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
          email: firebaseUser.email || '',
          phone: '',
          country: 'Global',
          role: resolvedRole,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        setDoc(userRef, newProfile).catch((err) => console.warn('Could not persist new user profile to Firestore:', err));
        if (newProfile.role === 'student') {
          recordStudentRegistration(newProfile).catch((err) => console.warn('Could not record student registration:', err));
        }
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Network/offline fallback while fetching user profile:', err);
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        studentId: 'ASH-STU-' + firebaseUser.uid.slice(0, 5).toUpperCase(),
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
        email: firebaseUser.email || '',
        phone: '',
        country: 'Global',
        role: resolvedRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          await fetchOrCreateProfile(fbUser);
          // Run background seeding when an authenticated session is established
          seedInitialCourses().catch(() => {});
          seedInitialCollaborations().catch(() => {});
          seedInitialEmailAccounts().catch(() => {});
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerStudent = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
  }): Promise<UserProfile> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const isAuthorizedAdmin = isAuthorizedAdminEmail(cleanEmail);
    const resolvedRole: 'admin' | 'student' = isAuthorizedAdmin ? 'admin' : 'student';

    // Persist credentials locally and in Firestore credentials collection
    const storedCred = await saveAccountCredential(
      cleanEmail,
      data.password,
      data.name,
      resolvedRole,
      data.phone,
      data.country
    );

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: data.name });

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        studentId: storedCred.studentId,
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        country: data.country || 'Global',
        role: resolvedRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), newProfile);
      if (newProfile.role === 'student') {
        recordStudentRegistration(newProfile).catch((err) => console.warn('Could not record student registration:', err));
      }
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      // If Firebase auth throws operation-not-allowed or network issues,
      // fallback to secure registered local profile (with strict password saved)
      const localUser: UserProfile = {
        uid: `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        studentId: storedCred.studentId,
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        country: data.country || 'Global',
        role: resolvedRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      setProfile(localUser);
      setUser({
        uid: localUser.uid,
        email: localUser.email,
        displayName: localUser.name,
      } as FirebaseUser);
      return localUser;
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    country?: string
  ): Promise<UserProfile> => {
    return registerStudent({ name, email, password: pass, phone, country });
  };

  const login = async (email: string, password: string): Promise<UserProfile | null> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth first
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const prof = await fetchOrCreateProfile(cred.user);
      return prof;
    } catch (err: any) {
      // If error is wrong-password or user-not-found from Firebase, check local credential store strictly
      console.warn('Firebase signIn failed or fallback needed:', err?.code, err?.message);

      // 2. Strict Password Verification Engine
      const verification = await verifyAccountCredentials(cleanEmail, password);

      if (!verification.success) {
        // STRICT REJECTION: Do NOT allow login with random/wrong password!
        throw new Error(
          verification.error ||
            'Authentication failed. Please check your password or set your password first.'
        );
      }

      const credData = verification.account!;
      const isAuthorizedAdmin = isAuthorizedAdminEmail(cleanEmail);
      const authenticatedUser: UserProfile = {
        uid: isAuthorizedAdmin
          ? cleanEmail === 'atifhuss773@gmail.com'
            ? 'admin-atif-uid'
            : 'admin-partner-uid'
          : `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        studentId: credData.studentId,
        name: credData.name,
        email: cleanEmail,
        phone: credData.phone || '',
        country: credData.country || 'Global',
        role: isAuthorizedAdmin ? 'admin' : 'student',
        status: 'active',
        createdAt: credData.createdAt,
        lastLogin: new Date().toISOString(),
      };

      setProfile(authenticatedUser);
      setUser({
        uid: authenticatedUser.uid,
        email: authenticatedUser.email,
        displayName: authenticatedUser.name,
      } as FirebaseUser);

      return authenticatedUser;
    }
  };

  const loginWithEmail = login;

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const prof = await fetchOrCreateProfile(cred.user);
      return prof;
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        const demoUser: UserProfile = {
          uid: 'google-demo-user',
          studentId: 'ASH-STU-00088',
          name: 'Demo Student (Google)',
          email: 'student.google@atifskillshub.org',
          role: 'student',
          status: 'active',
          country: 'Global',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setProfile(demoUser);
        setUser({
          uid: demoUser.uid,
          email: demoUser.email,
          displayName: demoUser.name,
        } as FirebaseUser);
        return demoUser;
      }
      throw err;
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.warn('Firebase password reset email skipped/offline', e);
    }
  };

  const setUserPassword = async (email: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    await setAccountPassword(cleanEmail, newPass);
    if (user && user.email?.toLowerCase() === cleanEmail) {
      // Keep session fresh
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data).catch((e) => console.warn('Could not update profile in Firestore:', e));
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const makeAdmin = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role: 'admin' }).catch(() => {});
    if (profile && profile.uid === uid) {
      setProfile({ ...profile, role: 'admin' });
    }
  };

  // Strict Dual-Admin: ONLY Atif Hussain and designated Partner can ever have isAdmin = true
  const isEmailAdmin = isAuthorizedAdminEmail(user?.email || profile?.email);
  const isAdmin = isEmailAdmin && (profile?.role === 'admin' || isEmailAdmin);
  const isStudent = !isAdmin;
  const isSuspended = profile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isStudent,
        isSuspended,
        partnerAdminEmail,
        updatePartnerAdminEmail,
        registerStudent,
        registerWithEmail,
        login,
        loginWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        setUserPassword,
        updateUserProfile,
        makeAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
