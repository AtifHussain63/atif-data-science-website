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
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Collaboration, CollaborationSettings } from '../types';
import { uploadFile } from './storageService';

const COLLABS_COL = 'collaborations';
const COLLAB_SETTINGS_DOC = 'collaborationSettings/global';

export const DEFAULT_COLLABORATION_SETTINGS: CollaborationSettings = {
  enabled: true,
  partnerName: 'Atif Skills Hub Support & Mathematics Seeker Academy',
  partnerEmail: 'dostdar.cui@gmail.com',
  collaborationType: 'Education & Learning Collaboration',
  description:
    'Atif Skills Hub Support & Mathematics Seeker Academy is a collaborative education and learning partner providing support and learning resources.',
  logoUrl: '',
  mainLogoUrl: '',
};

export const INITIAL_COLLABORATIONS: Collaboration[] = [
  {
    id: 'partner-math-seeker-academy',
    name: 'Atif Skills Hub Support & Mathematics Seeker Academy',
    email: 'dostdar.cui@gmail.com',
    category: 'Education & Learning Partner',
    description:
      'Atif Skills Hub Support & Mathematics Seeker Academy is a collaborative education and learning partner providing support and learning resources.',
    status: 'active',
    websiteUrl: 'mailto:dostdar.cui@gmail.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get global collaboration settings
 */
export const getCollaborationSettings = async (): Promise<CollaborationSettings> => {
  try {
    const snap = await getDoc(doc(db, COLLAB_SETTINGS_DOC));
    if (snap.exists()) {
      return { ...DEFAULT_COLLABORATION_SETTINGS, ...(snap.data() as CollaborationSettings) };
    }
  } catch (err) {
    console.warn('Error fetching collaboration settings:', err);
  }
  return DEFAULT_COLLABORATION_SETTINGS;
};

/**
 * Save global collaboration settings
 */
export const saveCollaborationSettings = async (
  settings: Partial<CollaborationSettings>
): Promise<CollaborationSettings> => {
  const current = await getCollaborationSettings();
  const updated: CollaborationSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLAB_SETTINGS_DOC), updated);

  // Sync to math seeker partner document if present
  try {
    const mathDocRef = doc(db, COLLABS_COL, 'partner-math-seeker-academy');
    await setDoc(
      mathDocRef,
      {
        id: 'partner-math-seeker-academy',
        name: updated.partnerName,
        email: updated.partnerEmail,
        category: updated.collaborationType,
        description: updated.description,
        status: updated.enabled ? 'active' : 'inactive',
        logoUrl: updated.logoUrl || '',
        updatedAt: updated.updatedAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync to partner document:', err);
  }

  return updated;
};

/**
 * Subscribe to global collaboration settings
 */
export const subscribeToCollaborationSettings = (
  callback: (settings: CollaborationSettings) => void
) => {
  return onSnapshot(
    doc(db, COLLAB_SETTINGS_DOC),
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_COLLABORATION_SETTINGS, ...(snap.data() as CollaborationSettings) });
      } else {
        callback(DEFAULT_COLLABORATION_SETTINGS);
      }
    },
    (err) => {
      console.warn('Subscription error for collaboration settings:', err);
      callback(DEFAULT_COLLABORATION_SETTINGS);
    }
  );
};

/**
 * Upload collaboration logo file to Firebase Storage
 */
export const uploadCollaborationLogo = async (file: File): Promise<string> => {
  const downloadUrl = await uploadFile(file, 'logos');
  await saveCollaborationSettings({ logoUrl: downloadUrl });
  return downloadUrl;
};

/**
 * Delete collaboration logo
 */
export const deleteCollaborationLogo = async (): Promise<void> => {
  await saveCollaborationSettings({ logoUrl: '' });
};

/**
 * Seed initial collaborations into Firestore if collection is empty or initial item missing
 */
export const seedInitialCollaborations = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      return;
    }
    const snap = await getDocs(collection(db, COLLABS_COL));
    if (snap.empty) {
      for (const item of INITIAL_COLLABORATIONS) {
        await setDoc(doc(db, COLLABS_COL, item.id), item);
      }
    } else {
      // Ensure the initial math seeker partner doc exists
      const mathDocRef = doc(db, COLLABS_COL, 'partner-math-seeker-academy');
      const mathDocSnap = await getDoc(mathDocRef);
      if (!mathDocSnap.exists()) {
        await setDoc(mathDocRef, INITIAL_COLLABORATIONS[0]);
      }
    }

    // Ensure settings doc exists
    const settingsSnap = await getDoc(doc(db, COLLAB_SETTINGS_DOC));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, COLLAB_SETTINGS_DOC), DEFAULT_COLLABORATION_SETTINGS);
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      return;
    }
    console.warn('Notice seeding collaborations:', err);
  }
};

/**
 * Fetch all collaborations from Firestore
 */
export const getAllCollaborations = async (includeInactive = false): Promise<Collaboration[]> => {
  try {
    const snap = await getDocs(collection(db, COLLABS_COL));
    if (snap.empty) {
      // Return initial fallback if first load before seed
      return includeInactive
        ? INITIAL_COLLABORATIONS
        : INITIAL_COLLABORATIONS.filter((c) => c.status === 'active');
    }
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Collaboration, 'id'>),
    }));

    return includeInactive ? items : items.filter((c) => c.status === 'active');
  } catch (err) {
    console.error('Error fetching collaborations:', err);
    return includeInactive
      ? INITIAL_COLLABORATIONS
      : INITIAL_COLLABORATIONS.filter((c) => c.status === 'active');
  }
};

/**
 * Subscribe to real-time updates for collaborations
 */
export const subscribeToCollaborations = (
  callback: (collabs: Collaboration[]) => void,
  includeInactive = false
) => {
  return onSnapshot(
    collection(db, COLLABS_COL),
    (snap) => {
      if (snap.empty) {
        callback(
          includeInactive
            ? INITIAL_COLLABORATIONS
            : INITIAL_COLLABORATIONS.filter((c) => c.status === 'active')
        );
        return;
      }
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Collaboration, 'id'>),
      }));
      callback(includeInactive ? items : items.filter((c) => c.status === 'active'));
    },
    (err) => {
      console.error('Error in collaborations subscription:', err);
      callback(
        includeInactive
          ? INITIAL_COLLABORATIONS
          : INITIAL_COLLABORATIONS.filter((c) => c.status === 'active')
      );
    }
  );
};

/**
 * Save or update collaboration in Firestore
 */
export const saveCollaboration = async (collab: Collaboration): Promise<void> => {
  const collabId = collab.id || `collab_${Date.now()}`;
  const data: Collaboration = {
    ...collab,
    id: collabId,
    updatedAt: new Date().toISOString(),
    createdAt: collab.createdAt || new Date().toISOString(),
  };
  await setDoc(doc(db, COLLABS_COL, collabId), data);
};

/**
 * Delete collaboration
 */
export const deleteCollaboration = async (collabId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLABS_COL, collabId));
};

/**
 * Toggle collaboration active/inactive status
 */
export const toggleCollaborationStatus = async (
  collabId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> => {
  await updateDoc(doc(db, COLLABS_COL, collabId), {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
};
