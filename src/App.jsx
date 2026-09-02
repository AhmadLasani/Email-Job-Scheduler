import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { auth, onAuthStateChanged, signOut, db, doc, getDoc } from './firebase/config';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { ComposeView } from './components/ComposeView';
import { ScheduledView } from './components/ScheduledView';
import { SentView } from './components/SentView';
import { SettingsView } from './components/SettingsView';
import { EmailDetailModal } from './components/EmailDetailModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('email_scheduler_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, sent: 0, failed: 0 });
  const [recentRecipients, setRecentRecipients] = useState([]);
  const [initialDraft, setInitialDraft] = useState(null);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const addToast = (text, type = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = useCallback(async () => {
    try {
      const currentUserId = user?.id;
      const [authData, emailsData, statsData, recData] = await Promise.all([
        api.getAuth(),
        api.getEmails(currentUserId),
        api.getStats(currentUserId),
        api.getRecentRecipients(currentUserId),
      ]);

      if (authData.user && authData.user.isAuthenticated) {
        setUser((prev) => {
          const updated = {
            ...authData.user,
            ...(prev?.gmailAppPassword ? { gmailAppPassword: prev.gmailAppPassword } : {}),
          };
          try {
            localStorage.setItem('email_scheduler_user', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      setEmails(emailsData.emails || []);
      setStats(statsData);
      setRecentRecipients(recData.recipients || []);
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let appPass = '';
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            appPass = userDoc.data().gmailAppPassword || '';
          }
        } catch (e) {
          console.warn('Firestore user fetch note:', e);
        }

        const loginRes = await api.login({
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          gmailAppPassword: appPass,
        });

        if (loginRes.success) {
          setUser(loginRes.user);
          try {
            localStorage.setItem('email_scheduler_user', JSON.stringify(loginRes.user));
          } catch (e) {}
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for background worker updates (scheduled -> sent transitions)
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogin = async (userData) => {
    try {
      const res = await api.login(userData);
      if (res.success) {
        setUser(res.user);
        try {
          localStorage.setItem('email_scheduler_user', JSON.stringify(res.user));
        } catch (e) {}
        setActiveTab('dashboard');
        fetchData();
        addToast(`Signed in as ${res.user.email || res.user.name}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      addToast('Failed to sign in. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut note:', e);
    }
    try {
      localStorage.removeItem('email_scheduler_user');
      await api.logout();
      setUser(null);
      addToast('Signed out', 'info');
    } catch {
      localStorage.removeItem('email_scheduler_user');
      setUser(null);
    }
  };

  const handleToggleGmail = async () => {
    try {
      const res = await api.toggleGmail();
      setUser(res.user);
      addToast(res.user.gmailConnected ? 'Gmail connected' : 'Gmail disconnected', 'info');
    } catch {
      addToast('Failed to update Gmail connection', 'error');
    }
  };

  const handleCancelEmail = async (id) => {
    try {
      await api.cancelEmail(id);
      addToast('Email cancelled', 'info');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to cancel email', 'error');
    }
  };

  const handleDuplicate = (email) => {
    setInitialDraft({
      to: email.to,
      subject: email.subject,
      body: email.body,
    });
    setViewingEmail(null);
    setActiveTab('compose');
  };

  const handleScheduleSuccess = (email, message) => {
    addToast(message, 'success');
    setInitialDraft(null);
    fetchData();
    setActiveTab('scheduled');
  };

  const handleSendNowSuccess = (email, message) => {
    addToast(message, 'success');
    setInitialDraft(null);
    fetchData();
    setActiveTab('sent');
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans text-neutral-900">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-normal">Loading Email Scheduler...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isAuthenticated) {
    return (
      <>
        <LandingPage onLogin={handleLogin} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans text-neutral-900 flex flex-col selection:bg-neutral-200">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        scheduledCount={stats.scheduled}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="tab-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DashboardView
                user={user}
                stats={stats}
                emails={emails}
                onComposeClick={() => {
                  setInitialDraft(null);
                  setActiveTab('compose');
                }}
                onViewEmail={(e) => setViewingEmail(e)}
                onCancelEmail={handleCancelEmail}
                onViewAllScheduled={() => setActiveTab('scheduled')}
              />
            </motion.div>
          )}

          {activeTab === 'compose' && (
            <motion.div
              key="tab-compose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ComposeView
                user={user}
                recentRecipients={recentRecipients}
                initialDraft={initialDraft}
                onScheduleSuccess={handleScheduleSuccess}
                onSendNowSuccess={handleSendNowSuccess}
                onCancel={() => setActiveTab('dashboard')}
                onUserUpdate={(updatedUser) => setUser(updatedUser)}
              />
            </motion.div>
          )}

          {activeTab === 'scheduled' && (
            <motion.div
              key="tab-scheduled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ScheduledView
                emails={emails}
                onComposeClick={() => {
                  setInitialDraft(null);
                  setActiveTab('compose');
                }}
                onViewEmail={(e) => setViewingEmail(e)}
                onCancelEmail={handleCancelEmail}
                onDuplicateEmail={handleDuplicate}
              />
            </motion.div>
          )}

          {activeTab === 'sent' && (
            <motion.div
              key="tab-sent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SentView
                emails={emails}
                onComposeClick={() => {
                  setInitialDraft(null);
                  setActiveTab('compose');
                }}
                onViewEmail={(e) => setViewingEmail(e)}
                onDuplicateEmail={handleDuplicate}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsView
                user={user}
                onToggleGmail={handleToggleGmail}
                onUserUpdate={(updatedUser) => setUser(updatedUser)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      {viewingEmail && (
        <EmailDetailModal
          email={viewingEmail}
          onClose={() => setViewingEmail(null)}
          onCancelEmail={handleCancelEmail}
          onDuplicateEmail={handleDuplicate}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
