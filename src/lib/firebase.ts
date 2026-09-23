import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

// Configure Firestore log level to silent to prevent connection timeout diagnostics
// from being emitted to the console in throttled or sandboxed iframe environments
try {
  setLogLevel('silent');
} catch {
  // Ignored if unsupported
}

// Filter out benign Firestore offline heuristic warnings from console.error in iframes
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      (args[0].includes('Could not reach Cloud Firestore backend') ||
       args[0].includes('Backend didn\'t respond within 10 seconds'))
    ) {
      // Benign offline fallback notification from Firestore SDK
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use initializeFirestore with auto-detect long polling and explicit databaseId
// to seamlessly adapt to network conditions and proxy limitations in sandboxed web environments
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  config.firestoreDatabaseId
);

export const storage = getStorage(app);

export default app;
