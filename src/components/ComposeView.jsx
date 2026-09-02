import React, { useState, useEffect } from 'react';
import { 
  Clock, Send, AlertCircle, Sparkles, Calendar, Key, CheckCircle2, 
  ExternalLink, RefreshCw, ChevronDown, ChevronUp, Server, ShieldCheck, Mail, Check
} from 'lucide-react';
import { api } from '../services/api';
import { 
  db, doc, setDoc, getCachedAccessToken, setCachedAccessToken, 
  auth, googleProvider, signInWithPopup, GoogleAuthProvider 
} from '../firebase/config';
import { sendEmailViaGmailApi } from '../services/gmailApi';
//add
export const ComposeView = ({
  user,
  recentRecipients,
  initialDraft,
  onScheduleSuccess,
  onSendNowSuccess,
  onCancel,
  onUserUpdate,
}) => {
  const [to, setTo] = useState(initialDraft?.to || '');
  const [subject, setSubject] = useState(initialDraft?.subject || '');
  const [body, setBody] = useState(initialDraft?.body || '');
  
  // Format current local datetime + 10 mins as default min/value
  const getMinDateTimeString = () => {
    const d = new Date(Date.now() + 60000); // 1 minute in future minimum
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getDefaultScheduledTime = () => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours from now
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [scheduledDateTime, setScheduledDateTime] = useState(getDefaultScheduledTime());
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [timezone] = useState('Asia/Kolkata');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quick SMTP configuration state directly inside composer
  const [showSmtpConfig, setShowSmtpConfig] = useState(!user?.gmailAppPassword && !user?.smtpHost);
  const [smtpMode, setSmtpMode] = useState(user?.smtpHost ? 'custom' : 'gmail');
  const [quickAppPassword, setQuickAppPassword] = useState(user?.gmailAppPassword || '');
  const [smtpHost, setSmtpHost] = useState(user?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(user?.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(user?.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(user?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(user?.smtpPass || '');

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [smtpSavedSuccess, setSmtpSavedSuccess] = useState(false);

  const hasSmtpConfigured = Boolean(
    user?.gmailAppPassword || 
    quickAppPassword || 
    (user?.smtpHost && user?.smtpUser && user?.smtpPass) ||
    (smtpHost && smtpUser && smtpPass)
  );

  useEffect(() => {
    if (initialDraft) {
      setTo(initialDraft.to || '');
      setSubject(initialDraft.subject || '');
      setBody(initialDraft.body || '');
    }
  }, [initialDraft]);

  useEffect(() => {
    if (user?.gmailAppPassword) {
      setQuickAppPassword(user.gmailAppPassword);
    }
    if (user?.smtpHost) {
      setSmtpHost(user.smtpHost);
      setSmtpPort(user.smtpPort || 587);
      setSmtpSecure(user.smtpSecure || false);
      setSmtpUser(user.smtpUser || '');
      setSmtpPass(user.smtpPass || '');
    }
  }, [user]);

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
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
        const passwordToUse = quickAppPassword.trim() || user?.gmailAppPassword;
        if (!passwordToUse) {
          throw new Error('Please enter your 16-character Google App Password.');
        }
        payload = {
          email: user?.gmailEmail || user?.email || 'manalitrip5454@gmail.com',
          password: passwordToUse,
        };
      }

      const res = await api.testSmtp(payload);
      setSmtpTestResult({ success: true, message: res.message || 'SMTP verified! Ready to send real emails directly.' });
    } catch (err) {
      setSmtpTestResult({ success: false, message: err.message || 'SMTP test failed. Please verify credentials.' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e?.preventDefault();
    setIsSavingSmtp(true);
    setSmtpSavedSuccess(false);
    setSmtpTestResult(null);

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
            gmailAppPassword: quickAppPassword.trim(),
            gmailEmail: user?.gmailEmail || user?.email,
          };

      const res = await api.updateCredentials(payload);

      // Also persist to Firestore if user ID exists
      if (user?.uid || user?.id) {
        try {
          const userRef = doc(db, 'users', user.uid || user.id);
          await setDoc(
            userRef,
            {
              email: user.email,
              displayName: user.name || user.displayName,
              ...(smtpMode === 'custom' ? payload : { gmailAppPassword: quickAppPassword.trim() }),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fErr) {
          console.warn('Firestore doc sync note:', fErr);
        }
      }

      setSmtpSavedSuccess(true);
      if (onUserUpdate && res.user) {
        onUserUpdate(res.user);
      }
      setTimeout(() => setSmtpSavedSuccess(false), 3500);
    } catch (err) {
      setSmtpTestResult({ success: false, message: err.message || 'Failed to save SMTP settings.' });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    let target = new Date();

    if (preset === '1hour') {
      target = new Date(now.getTime() + 1000 * 60 * 60);
    } else if (preset === 'tomorrow9am') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
    } else if (preset === 'tomorrow2pm') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0, 0);
    } else if (preset === 'monday9am') {
      const day = now.getDay();
      const diff = (8 - day) % 7 || 7;
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 9, 0, 0);
    }

    const val = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
    setScheduledDateTime(val);
    setErrorMessage(null);
  };

  const handleCustomDateChange = (e) => {
    const chosenVal = e.target.value;
    setSelectedPreset(null);
    setScheduledDateTime(chosenVal);
    
    // Immediate validation
    if (chosenVal) {
      const chosenTime = new Date(chosenVal).getTime();
      if (chosenTime <= Date.now()) {
        setErrorMessage('Scheduled time must be in the future. Past dates/times are not allowed.');
      } else {
        setErrorMessage(null);
      }
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!to || !to.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }
    if (!scheduledDateTime) {
      setErrorMessage('Please select when this email should be sent.');
      return;
    }

    const scheduledDate = new Date(scheduledDateTime);
    if (isNaN(scheduledDate.getTime())) {
      setErrorMessage('Invalid date/time format.');
      return;
    }

    if (scheduledDate.getTime() <= Date.now() + 5000) {
      setErrorMessage('Scheduled time must be in the future (at least 1 minute ahead).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.scheduleEmail({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        scheduledFor: scheduledDate.toISOString(),
        senderEmail: user?.gmailEmail || user?.email || 'manalitrip5454@gmail.com',
        senderName: user?.name || 'Ahmad Larabi',
        gmailAppPassword: quickAppPassword || user?.gmailAppPassword || '',
        smtpHost: smtpHost || user?.smtpHost,
        smtpPort: smtpPort || user?.smtpPort,
        smtpSecure: smtpSecure ?? user?.smtpSecure,
        smtpUser: smtpUser || user?.smtpUser,
        smtpPass: smtpPass || user?.smtpPass,
        userId: user?.id || user?.uid,
      });

      if (res.success) {
        onScheduleSuccess(res.email, `Email queued for delivery directly to ${to.trim()} at ${scheduledDate.toLocaleTimeString()}`);
      } else {
        setErrorMessage(res.error || 'Failed to schedule email');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while scheduling email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const handleConnectGoogleOAuth = async () => {
    setIsConnectingGoogle(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        setCachedAccessToken(token);
        // Trigger a force re-render
        setSelectedPreset((prev) => prev);
      }
    } catch (err) {
      console.warn('OAuth connect error:', err);
      if (err.message?.includes('access_denied') || err.message?.includes('403')) {
        setErrorMessage('Google OAuth Notice: This Google account needs to be in the Google Cloud OAuth Test Users list, or you can use your 16-character Google App Password below.');
      } else {
        setErrorMessage(err.message || 'Failed to grant Gmail permissions.');
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleSendNow = async () => {
    setErrorMessage(null);

    if (!to || !to.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }

    try {
      setIsSubmitting(true);
      const oauthToken = getCachedAccessToken();
      const senderFrom = user?.gmailEmail || user?.email || 'manalitrip5454@gmail.com';
      const senderDisplayName = user?.name || 'Adnan';

      // 1. If Google OAuth token is active (from Google Sign-In with gmail.send scope),
      // send directly via Google Gmail API from the authenticated account!
      if (oauthToken) {
        try {
          const gmailResult = await sendEmailViaGmailApi({
            to: to.trim(),
            subject: subject.trim(),
            body: body.trim(),
            fromName: senderDisplayName,
            fromEmail: senderFrom,
            accessToken: oauthToken,
          });

          // Record this successful direct send in the backend email database
          const recordRes = await api.recordEmail({
            to: to.trim(),
            subject: subject.trim(),
            body: body.trim(),
            senderEmail: senderFrom,
            senderName: senderDisplayName,
            status: 'sent',
            sentAt: new Date().toISOString(),
            userId: user?.id || user?.uid,
            deliveryMethod: 'Google OAuth (Gmail API)',
            googleMessageId: gmailResult.messageId,
          });

          onSendNowSuccess(
            recordRes.email || {
              id: 'gmail_' + Date.now(),
              to: to.trim(),
              subject: subject.trim(),
              body: body.trim(),
              senderEmail: senderFrom,
              senderName: senderDisplayName,
              status: 'sent',
              sentAt: new Date().toISOString(),
            },
            `Delivered directly from ${senderFrom} to ${to.trim()} via Gmail OAuth!`
          );
          return;
        } catch (oauthErr) {
          console.warn('[Gmail OAuth Send failed]:', oauthErr);
          // If the error indicates missing permissions, prompt user to sign in again
          if (oauthErr.message && (oauthErr.message.includes('403') || oauthErr.message.includes('insufficient') || oauthErr.message.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT'))) {
            setErrorMessage('Gmail send permission was not granted during Google sign-in. Please sign out and sign in again to grant Gmail permissions, or enter an App Password below.');
            return;
          }
        }
      }

      // 2. Fallback to backend SMTP dispatch
      const res = await api.sendNow({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        senderEmail: senderFrom,
        senderName: senderDisplayName,
        gmailAppPassword: quickAppPassword || user?.gmailAppPassword || '',
        smtpHost: smtpHost || user?.smtpHost,
        smtpPort: smtpPort || user?.smtpPort,
        smtpSecure: smtpSecure ?? user?.smtpSecure,
        smtpUser: smtpUser || user?.smtpUser,
        smtpPass: smtpPass || user?.smtpPass,
        userId: user?.id || user?.uid,
      });

      if (res.success) {
        onSendNowSuccess(res.email, `Email dispatched directly to ${to.trim()} from ${senderFrom}`);
      } else {
        setErrorMessage(res.error || 'Failed to send email directly. Please check your SMTP / App Password settings.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while dispatching email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertTemplate = (type) => {
    if (type === 'reminder') {
      setSubject('Friendly Reminder: Upcoming discussion');
      setBody(
        `Hi,\n\nJust wanted to send a quick reminder regarding our upcoming session scheduled for next week.\n\nPlease let me know if you need to review the agenda in advance.\n\nBest regards,\n${user?.name || 'Ahmad'}`
      );
    } else if (type === 'update') {
      setSubject('Project Weekly Progress Update');
      setBody(
        `Hi Team,\n\nHere is our summary of milestones completed this week and deliverables lined up for next sprint.\n\nEverything is currently tracking on schedule.\n\nCheers,\n${user?.name || 'Ahmad'}`
      );
    } else if (type === 'followup') {
      setSubject('Following up on our recent conversation');
      setBody(
        `Hello,\n\nI am checking in to see if you had a chance to review the notes we discussed earlier.\n\nLooking forward to hearing your thoughts!\n\nBest,\n${user?.name || 'Ahmad'}`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight">
            Compose & Send Direct Email
          </h1>
          <p className="text-sm text-neutral-500 font-normal mt-1">
            Dispatch directly to any recipient inbox immediately or queue for future background delivery.
          </p>
        </div>

        {/* Quick template triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-neutral-500 font-normal mr-1 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            Templates:
          </span>
          <button
            type="button"
            onClick={() => insertTemplate('reminder')}
            className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer font-normal"
          >
            Reminder
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('update')}
            className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer font-normal"
          >
            Project Update
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('followup')}
            className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer font-normal"
          >
            Follow Up
          </button>
        </div>
      </div>

      {/* Dispatch Engine Indicator Card */}
      <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-4 sm:p-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              getCachedAccessToken() || hasSmtpConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {getCachedAccessToken() ? <ShieldCheck className="w-4 h-4 text-emerald-700" /> : <Server className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-neutral-900">
                  {getCachedAccessToken() ? 'Gmail OAuth Live Delivery' : 'Email Dispatch Engine'}
                </span>
                {getCachedAccessToken() ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Google Account Connected
                  </span>
                ) : hasSmtpConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    SMTP Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    App Password Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-normal mt-0.5">
                Sending as: <span className="font-mono text-neutral-800 font-medium">{user?.gmailEmail || user?.email || 'manalitrip5454@gmail.com'}</span>
                {getCachedAccessToken() && (
                  <span className="text-emerald-700 ml-1 font-normal">• Delivers directly to receiver's inbox</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {!getCachedAccessToken() && (
              <button
                type="button"
                onClick={handleConnectGoogleOAuth}
                disabled={isConnectingGoogle}
                className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-normal transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{isConnectingGoogle ? 'Connecting...' : 'Authorize Gmail Direct Send'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSmtpConfig(!showSmtpConfig)}
              className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-normal transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Key className="w-3.5 h-3.5 text-neutral-500" />
              <span>{showSmtpConfig ? 'Hide Settings' : 'Configure SMTP / Password'}</span>
              {showSmtpConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Quick SMTP Setup Form */}
        {showSmtpConfig && (
          <div className="mt-4 pt-4 border-t border-neutral-200/80 space-y-4">
            {/* Mode selection tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSmtpMode('gmail')}
                className={`text-xs px-3 py-1.5 rounded-lg font-normal transition-colors cursor-pointer ${
                  smtpMode === 'gmail'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-200/60 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Gmail SMTP (App Password)
              </button>
              <button
                type="button"
                onClick={() => setSmtpMode('custom')}
                className={`text-xs px-3 py-1.5 rounded-lg font-normal transition-colors cursor-pointer ${
                  smtpMode === 'custom'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-200/60 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Custom SMTP Server
              </button>
            </div>

            {smtpMode === 'gmail' ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      type="password"
                      value={quickAppPassword}
                      onChange={(e) => setQuickAppPassword(e.target.value)}
                      placeholder="Enter 16-character Google App Password (e.g. abcd efgh ijkl mnop)"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-mono placeholder:font-sans placeholder:text-neutral-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSmtp}
                      disabled={isSavingSmtp || !quickAppPassword}
                      className="px-3.5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-normal hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSmtp ? 'Saving...' : 'Save Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp || !quickAppPassword}
                      className="px-3 py-2 border border-neutral-300 bg-white text-neutral-700 rounded-xl text-xs font-normal hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {isTestingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Test Connection</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 flex items-center justify-between flex-wrap gap-2">
                  <span>Emails will be delivered directly from <strong>{user?.email || 'manalitrip5454@gmail.com'}</strong> to recipient mailboxes.</span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Generate Google App Password <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.mailgun.org"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">Port</label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                  <div className="flex items-center pt-5">
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
                    <label className="block text-[11px] text-neutral-500 mb-1">SMTP Username / Email</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="username@domain.com"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    disabled={isSavingSmtp || !smtpHost || !smtpUser}
                    className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-normal hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSmtp ? 'Saving...' : 'Save Custom SMTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={isTestingSmtp || !smtpHost || !smtpUser}
                    className="px-3 py-1.5 border border-neutral-300 bg-white text-neutral-700 rounded-xl text-xs font-normal hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isTestingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>
            )}

            {/* Test or save feedback inside compose view */}
            {smtpTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  smtpTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{smtpTestResult.success ? 'SMTP Verified' : 'SMTP Error'}</p>
                  <p className="mt-0.5 opacity-90">{smtpTestResult.message}</p>
                </div>
              </div>
            )}

            {smtpSavedSuccess && (
              <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SMTP credentials saved! All composed emails will dispatch directly through this server.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 font-normal">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-medium">Delivery Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Compose Card */}
      <form onSubmit={handleSchedule} className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* From / Sender line */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 text-xs sm:text-sm text-neutral-500 font-normal">
          <span className="text-neutral-700 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-neutral-400" />
            <span>Sender</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-neutral-900 font-medium">{user?.name || 'Adnan Ahmed'}</span>
            <span className="text-neutral-400 font-mono text-xs">({user?.gmailEmail || user?.email || 'manalitrip5454@gmail.com'})</span>
          </div>
        </div>

        {/* To input */}
        <div className="space-y-2">
          <label className="block text-xs font-normal uppercase tracking-wider text-neutral-500">
            To (Recipient Email Address)
          </label>
          <input
            type="email"
            placeholder="e.g. colleague@company.com or client@gmail.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-normal font-sans"
          />

          {recentRecipients.length > 0 && !to && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 font-normal">
              <span className="text-[11px] text-neutral-400">Recent:</span>
              {recentRecipients.slice(0, 4).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setTo(r)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subject input */}
        <div className="space-y-2">
          <label className="block text-xs font-normal uppercase tracking-wider text-neutral-500">
            Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Meeting notes & quarterly roadmap"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-normal"
          />
        </div>

        {/* Body input */}
        <div className="space-y-2">
          <label className="block text-xs font-normal uppercase tracking-wider text-neutral-500">
            Message Body
          </label>
          <textarea
            rows={8}
            placeholder="Write your email message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all resize-y leading-relaxed font-sans font-normal"
          />
        </div>

        {/* Schedule Timing Section */}
        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-normal uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>Schedule Delivery Time (Future Only)</span>
            </label>
            <span className="text-xs text-neutral-400">Timezone: {timezone}</span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('1hour')}
              className={`py-2 px-3 text-xs font-normal rounded-xl border transition-all cursor-pointer ${
                selectedPreset === '1hour'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              In 1 hour
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tomorrow9am')}
              className={`py-2 px-3 text-xs font-normal rounded-xl border transition-all cursor-pointer ${
                selectedPreset === 'tomorrow9am'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Tomorrow 9:00 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tomorrow2pm')}
              className={`py-2 px-3 text-xs font-normal rounded-xl border transition-all cursor-pointer ${
                selectedPreset === 'tomorrow2pm'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Tomorrow 2:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('monday9am')}
              className={`py-2 px-3 text-xs font-normal rounded-xl border transition-all cursor-pointer ${
                selectedPreset === 'monday9am'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Next Monday 9:00 AM
            </button>
          </div>

          {/* Custom DateTime picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 font-normal">Custom delivery date & time:</label>
            <input
              type="datetime-local"
              min={getMinDateTimeString()}
              value={scheduledDateTime}
              onChange={handleCustomDateChange}
              className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-mono font-normal"
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-normal text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer text-center"
          >
            Discard
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSendNow}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending via SMTP...' : 'Send Now (Direct to Recipient)'}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{isSubmitting ? 'Scheduling...' : 'Schedule Email'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
