import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import firebaseConfigStatic from '../firebase-applet-config.json';

// Firebase configuration for Charvi Rentals
const firebaseConfig = {
  ...firebaseConfigStatic
};

// Initialize Firebase App
let app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export let auth = getAuth(app);

/**
 * Dynamically updates the Firebase configuration.
 * Useful when google-services.json is uploaded to the VPS root.
 */
export const updateFirebaseConfig = async (newConfig: any) => {
  if (!newConfig || !newConfig.apiKey || !newConfig.projectId) return;
  console.log('[Firebase] Applying configuration from google-services.json (Project:', newConfig.projectId, ')');
  try {
    const existingApps = getApps();
    for (const a of existingApps) {
      try {
        await deleteApp(a);
      } catch {}
    }
    app = initializeApp(newConfig);
    auth = getAuth(app);
    console.log('[Firebase] Successfully re-initialized with VPS google-services.json');
  } catch (err) {
    console.error('[Firebase] Re-initialization notice:', err);
  }
};

// Provider with OAuth scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track sign in state
let isSigningIn = false;
// Cache the access token in memory (never localStorage)
let cachedAccessToken: string | null = null;

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'renter' | 'lender';
}

/**
 * Initialize auth state listener. Also handles processing redirect results for mobile logins.
 * Automatically checks /api/firebase-config to load google-services.json from the VPS root if uploaded.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  let unsubscribe: () => void = () => {};

  const setupListener = () => {
    // Check for redirect result on load
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken || await result.user.getIdToken();
          cachedAccessToken = token;

          // Sync user with backend
          try {
            await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: result.user.uid,
                email: result.user.email,
                name: result.user.displayName,
                avatar: result.user.photoURL,
                role: 'renter',
              }),
            });
          } catch (e) {
            console.warn('Backend user sync warning after redirect:', e);
          }

          if (onAuthSuccess) onAuthSuccess(result.user, token);
        }
      })
      .catch((err) => {
        console.error('Redirect login error:', err);
      });

    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          try {
            const token = await user.getIdToken();
            cachedAccessToken = token;
            if (onAuthSuccess) onAuthSuccess(user, token);
          } catch {
            cachedAccessToken = null;
            if (onAuthFailure) onAuthFailure();
          }
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  };

  // Immediate listener with default/fallback config
  unsubscribe = setupListener();

  // Asynchronously query server for uploaded google-services.json
  fetch('/api/firebase-config')
    .then((res) => (res.ok ? res.json() : null))
    .then(async (vpsConfig) => {
      if (vpsConfig && vpsConfig.apiKey && vpsConfig.projectId) {
        await updateFirebaseConfig(vpsConfig);
        unsubscribe();
        unsubscribe = setupListener();
      }
    })
    .catch(() => {
      // Offline or using standard config
    });

  return () => {
    unsubscribe();
  };
};

/**
 * Sign in using Google OAuth (Popup for desktop, Redirect for mobile).
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
      // Open in same page using redirect on mobile
      await signInWithRedirect(auth, provider);
      return null; // The redirect will take over the page
    } else {
      // Use popup on desktop
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || await result.user.getIdToken();
      cachedAccessToken = token;

      // Sync user with backend
      try {
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            avatar: result.user.photoURL,
          }),
        });
      } catch (e) {
        console.warn('Backend user sync warning:', e);
      }

      return { user: result.user, accessToken: token };
    }
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      cachedAccessToken = token;
      return token;
    } catch {
      return null;
    }
  }
  return null;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const token = await result.user.getIdToken();
  cachedAccessToken = token;
  return result.user;
};

/**
 * Sign up with Email, Password and Display Name
 */
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  const token = await result.user.getIdToken();
  cachedAccessToken = token;
  return result.user;
};
