import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({ prompt: 'consent select_account' });

// In-memory and session access token cache for OAuth APIs
let inMemoryAccessToken = null;

export const setCachedAccessToken = (token) => {
  inMemoryAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('google_oauth_token', token);
    } else {
      sessionStorage.removeItem('google_oauth_token');
    }
  } catch (e) {}
};

export const getCachedAccessToken = () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    return sessionStorage.getItem('google_oauth_token');
  } catch (e) {
    return null;
  }
};

// Initialize Firestore (with custom database ID if present)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
};
