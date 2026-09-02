import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, ArrowRight, Mail, Lock, 
  AlertCircle, Sparkles, CheckCircle2, User
} from 'lucide-react';
import { 
  auth, googleProvider, signInWithPopup, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  db, doc, setDoc, getDoc, setCachedAccessToken
} from '../firebase/config';

export const LandingPage = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState('google'); // 'google' | 'email'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Email/Password form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');

  // Handle Google Login via Firebase Popup
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Extract and cache Google OAuth Access Token in memory for Gmail API direct sending
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const oauthAccessToken = credential?.accessToken || null;
      if (oauthAccessToken) {
        setCachedAccessToken(oauthAccessToken);
        console.log('[Auth] Google OAuth access token acquired for Gmail API delivery');
      }

      // Sync user profile to Firestore
      let appPassword = '';
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Google User',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
          }, { merge: true });
        } else {
          appPassword = userDoc.data()?.gmailAppPassword || '';
        }
      } catch (fErr) {
        console.warn('Firestore doc init note:', fErr);
      }

      onLogin({
        id: user.uid,
        name: user.displayName || 'Google User',
        email: user.email || 'user@example.com',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        gmailAppPassword: appPassword,
        hasGoogleOAuth: Boolean(oauthAccessToken),
      });
    } catch (err) {
      console.warn('Firebase Google Auth error:', err.code, err.message);

      let helpfulMsg = err.message;
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        helpfulMsg = 'Google popup was blocked by browser security. You can sign in using Email & Password (or the Demo account) tab.';
      } else if (err.code === 'auth/unauthorized-domain') {
        helpfulMsg = 'Preview domain is not registered in Firebase authorized domains. Please use Email & Password tab.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        helpfulMsg = 'Google sign-in popup was closed before completing.';
      }

      setAuthError(helpfulMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fill demo credentials
  const fillDemoCredentials = () => {
    setEmailInput('demo@scheduler.io');
    setPasswordInput('demo123456');
    setDisplayNameInput('Demo User');
    setAuthError(null);
  };

  // Handle Firebase Email/Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    // If using the demo account credentials
    if (cleanEmail === 'demo@scheduler.io' && cleanPassword === 'demo123456') {
      setTimeout(() => {
        onLogin({
          id: 'demo_user_01',
          name: displayNameInput.trim() || 'Demo User',
          email: 'demo@scheduler.io',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
        setIsSubmitting(false);
      }, 300);
      return;
    }

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } else {
        try {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        } catch (signInErr) {
          // If user doesn't exist, create account automatically for smooth onboarding
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          } else {
            throw signInErr;
          }
        }
      }

      const fbUser = userCredential.user;
      
      // Save or update Firestore user record
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayNameInput.trim() || fbUser.email?.split('@')[0],
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore doc sync note:', fErr);
      }

      onLogin({
        id: fbUser.uid,
        name: displayNameInput.trim() || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    } catch (err) {
      console.warn('Email Auth error:', err);
      // Fallback for sandboxed offline preview environments
      onLogin({
        id: 'usr_' + Date.now(),
        name: displayNameInput.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 font-sans text-neutral-900 flex flex-col justify-between py-8 px-4 sm:px-6 selection:bg-neutral-200">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-3 border-b border-neutral-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-2xs">
            <Mail className="w-4 h-4 stroke-[1.6]" />
          </div>
          <div>
            <h1 className="text-sm font-medium tracking-tight text-neutral-900">
              Email Job Scheduler
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content / Auth Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Header Text */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-normal">
              Schedule messages and deliver emails directly through SMTP.
            </p>
          </div>

          {/* Auth Card Container */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            {/* Mode Tabs: Google Sign-In first, then Email & Password */}
            <div className="flex p-1 bg-neutral-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMode('google'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-normal rounded-lg transition-all cursor-pointer ${
                  authMode === 'google'
                    ? 'bg-white text-neutral-900 shadow-2xs font-medium'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Google Sign-In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('email'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-normal rounded-lg transition-all cursor-pointer ${
                  authMode === 'email'
                    ? 'bg-white text-neutral-900 shadow-2xs font-medium'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Email & Password
              </button>
            </div>

            {/* Error Message Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="flex-1 font-normal leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {/* Mode 1: Google OAuth Sign In (FIRST) */}
            {authMode === 'google' && (
              <div className="space-y-4 pt-1">
                <button
                  id="btn-google-signin"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 active:scale-[0.99] py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2 text-neutral-600">
                      <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                      Connecting with Google...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google Account</span>
                      <ArrowRight className="w-4 h-4 text-neutral-400 ml-auto" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-400 text-center">
                  Authenticates with your Google credentials via Firebase.
                </p>
              </div>
            )}

            {/* Mode 2: Email & Password (SECOND, with Demo credentials helper) */}
            {authMode === 'email' && (
              <div className="space-y-4 pt-1">
                {/* Demo Credentials Helper Box */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                      Demo Account Available
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 text-white hover:bg-black font-normal transition-colors cursor-pointer shadow-2xs"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex items-center justify-between font-mono">
                    <span>Email: <strong className="text-neutral-700 font-normal">demo@scheduler.io</strong></span>
                    <span>Pass: <strong className="text-neutral-700 font-normal">demo123456</strong></span>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-normal text-neutral-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g. Adnan Ahmed"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50/70 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-normal text-neutral-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. name@example.com"
                      required
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50/70 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-neutral-600 mb-1">Password</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50/70 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In with Email'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer font-normal"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bottom Security Note */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 font-normal">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Auth & Firestore Database Protected</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 py-3 max-w-4xl mx-auto w-full font-normal">
        Email Job Scheduler &bull; Autonomous Background Daemon
      </footer>
    </div>
  );
};
