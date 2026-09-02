import React, { useState, useEffect } from 'react';
import { Mail, Server, ShieldCheck, Key, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Check } from 'lucide-react';
import { api } from '../services/api';
import { db, doc, setDoc, getCachedAccessToken } from '../firebase/config';

export const SettingsView = ({ user, onToggleGmail, onUserUpdate }) => {
  const [smtpMode, setSmtpMode] = useState(user?.smtpHost ? 'custom' : 'gmail');
  const [appPassword, setAppPassword] = useState(user?.gmailAppPassword || '');
  const [smtpHost, setSmtpHost] = useState(user?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(user?.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(user?.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(user?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(user?.smtpPass || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.gmailAppPassword) {
      setAppPassword(user.gmailAppPassword);
    }
    if (user?.smtpHost) {
      setSmtpHost(user.smtpHost);
      setSmtpPort(user.smtpPort || 587);
      setSmtpSecure(user.smtpSecure || false);
      setSmtpUser(user.smtpUser || '');
      setSmtpPass(user.smtpPass || '');
      setSmtpMode('custom');
    }
  }, [user]);

  const handleSaveCredentials = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setTestResult(null);

    try {
      const payload = smtpMode === 'custom'
        ? {
            smtpHost: smtpHost.trim(),
            smtpPort: parseInt(smtpPort, 10) || 587,
            smtpSecure,
            smtpUser: smtpUser.trim(),
            smtpPass: smtpPass.trim(),
          }
        : {
            gmailAppPassword: appPassword.trim(),
            gmailEmail: user?.gmailEmail || user?.email,
          };

      // 1. Update on server session / dynamic state
      const res = await api.updateCredentials(payload);

      // 2. Persist to Firebase Firestore if logged in
      if (user?.uid || user?.id) {
        try {
          const userRef = doc(db, 'users', user.uid || user.id);
          await setDoc(
            userRef,
            {
              email: user.email,
              displayName: user.name || user.displayName,
              ...(smtpMode === 'custom' ? payload : { gmailAppPassword: appPassword.trim() }),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fErr) {
          console.warn('Firestore user doc sync note:', fErr);
        }
      }

      setSaveSuccess(true);
      if (onUserUpdate && res.user) {
        onUserUpdate(res.user);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Failed to save credentials' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      let payload = {};
      if (smtpMode === 'custom') {
        if (!smtpHost || !smtpUser || !smtpPass) {
          throw new Error('Please fill in SMTP Host, Username, and Password.');
        }
        payload = {
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort, 10) || 587,
          smtpSecure,
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
        };
      } else {
        if (!appPassword) {
          throw new Error('Please provide your 16-character Google App Password.');
        }
        payload = {
          email: user?.gmailEmail || user?.email,
          password: appPassword.trim(),
        };
      }

      const res = await api.testSmtp(payload);
      setTestResult({ success: true, message: res.message || 'SMTP Authentication successful! Direct delivery active.' });
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'SMTP Authentication failed. Check your settings.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 font-normal mt-1">
          Manage sending accounts, Google Workspace connection, and dynamic direct SMTP delivery credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Gmail Account Card */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                <Mail className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-base font-medium text-neutral-900">Google / Sender Account</h2>
                <p className="text-xs text-neutral-500 font-normal">Active sender account connected via Firebase Login</p>
              </div>
            </div>

            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/70 mb-5 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neutral-200" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-neutral-900">{user?.name || 'Ahmad Larabi'}</p>
                <p className="text-neutral-500 text-xs font-normal">{user?.email || 'manalitrip5454@gmail.com'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-500 flex items-center gap-1.5 font-normal">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Firebase Authentication Active
            </span>

            {getCachedAccessToken() ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Gmail OAuth Direct Delivery Active
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-normal">
                Standard SMTP fallback available below
              </span>
            )}
          </div>
        </div>

        {/* Dynamic SMTP Configuration Card */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Key className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base font-medium text-neutral-900">SMTP Direct Dispatch Settings</h2>
              <p className="text-xs text-neutral-500 font-normal">Configure credentials for direct inbox delivery without third-party proxies</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSmtpMode('gmail')}
              className={`text-xs px-3.5 py-2 rounded-xl font-normal transition-colors cursor-pointer ${
                smtpMode === 'gmail'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Gmail SMTP (Google App Password)
            </button>
            <button
              type="button"
              onClick={() => setSmtpMode('custom')}
              className={`text-xs px-3.5 py-2 rounded-xl font-normal transition-colors cursor-pointer ${
                smtpMode === 'custom'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Custom SMTP Server
            </button>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            {smtpMode === 'gmail' ? (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  16-Character Google App Password
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="e.g. abcd efgh ijkl mnop"
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white text-neutral-900 placeholder:text-neutral-400 font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs sm:text-sm font-normal hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !appPassword}
                      className="px-3.5 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs sm:text-sm font-normal hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Test SMTP</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.mailgun.org"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white text-neutral-900 font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">Port</label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white text-neutral-900 font-normal"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>SSL / TLS (Port 465)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">SMTP Username / Email</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="user@domain.com"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white text-neutral-900 font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white text-neutral-900 font-normal"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !smtpHost || !smtpUser}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs sm:text-sm font-normal hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Custom SMTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !smtpHost || !smtpUser}
                    className="px-3.5 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs sm:text-sm font-normal hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Test SMTP</span>
                  </button>
                </div>
              </div>
            )}

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{testResult.success ? 'SMTP Verified' : 'Authentication Error'}</p>
                  <p className="mt-0.5 opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SMTP credentials saved successfully! Your emails will dispatch directly to recipient mailboxes.</span>
              </div>
            )}

            {/* Google Help Box */}
            {smtpMode === 'gmail' && (
              <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-3.5 text-xs text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-900 flex items-center gap-1.5">
                  <span>How to generate a Google App Password (takes 30 seconds):</span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Open Page <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-neutral-500 pl-1">
                  <li>Make sure 2-Step Verification is active on your Google Account.</li>
                  <li>Go to <strong className="text-neutral-700">Security → App Passwords</strong>.</li>
                  <li>Enter <strong className="text-neutral-700">"Email Scheduler"</strong> as the app name.</li>
                  <li>Copy the 16-character code and paste it above.</li>
                </ol>
              </div>
            )}
          </form>
        </div>

        {/* Server Daemon Health */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Server className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base font-medium text-neutral-900">Background Worker Daemon</h2>
              <p className="text-xs text-neutral-500 font-normal">Autonomous queue processor & scheduler loop</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed mb-5 font-normal">
            The background daemon continuously checks for pending scheduled emails every few seconds. Even if you close your browser, log out, or power down your computer, emails are safely queued and dispatched by the server directly at their exact scheduled time.
          </p>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Worker Running (Interval: 3s)</span>
            </div>

            <div className="text-neutral-400 text-xs font-normal">
              Storage: JSON Persistent Database & Firestore Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
