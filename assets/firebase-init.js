// assets/firebase-init.js
// Single shared Firebase initialization. Every page imports from here so
// there is exactly one Firebase App instance per tab.
//
// NOTE: this apiKey is a public *client* identifier, not a secret — Firebase
// web API keys are meant to be embedded in frontend code (see Firebase docs
// "Is it safe to expose my Firebase apiKey?"). Actual access control lives
// in Firestore Security Rules and in the backend's verifyIdToken check, not
// in hiding this value.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAI1I2BBfYIERfI7vaNKYytH3kq4nNrZ44",
  authDomain: "focusspace-fc0f3.firebaseapp.com",
  projectId: "focusspace-fc0f3",
  storageBucket: "focusspace-fc0f3.firebasestorage.app",
  messagingSenderId: "426281589068",
  appId: "1:426281589068:web:7dfb2bae68888c4c7ed7e9",
  measurementId: "G-Y1JGTKSMDH",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// Keep the session across tab closes (still fully revocable server-side by
// disabling the user in Firebase Console, and every request is re-verified
// against Google's servers via verifyIdToken — this only affects how long
// the *browser* remembers the sign-in).
setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
};

/** True if this user's identity is considered verified (Google is
 * pre-verified by Google; email/password needs the emailVerified flag). */
export function isVerified(user) {
  if (!user) return false;
  if (user.providerData.some((p) => p.providerId === "google.com")) return true;
  return !!user.emailVerified;
}

/** Creates the user's Firestore profile doc on first sign-in, or just
 * bumps lastLoginAt on subsequent ones — never clobbers createdAt. */
export async function syncUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref).catch(() => null);
  const base = {
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    provider: user.providerData[0]?.providerId || "password",
    lastLoginAt: serverTimestamp(),
  };
  if (!existing || !existing.exists()) {
    base.createdAt = serverTimestamp();
  }
  await setDoc(ref, base, { merge: true });
}
