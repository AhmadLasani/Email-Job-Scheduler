import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent Data Storage Paths
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface EmailRecord {
  id: string;
  userId?: string;
  to: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  scheduledFor: string; // ISO string
  timezone: string;
  createdAt: string;
  sentAt?: string;
  failedReason?: string;
  senderEmail: string;
  senderName: string;
  gmailAppPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  etherealUrl?: string;
}

export interface UserAuth {
  id: string;
  name: string;
  email: string;
  avatar: string;
  gmailConnected: boolean;
  gmailEmail: string;
  gmailAppPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  isAuthenticated: boolean;
}

// Initial default user
let currentUser: UserAuth = {
  id: 'user_1',
  name: 'Adnan Ahmed',
  email: 'manalitrip5454@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  gmailConnected: true,
  gmailEmail: 'manalitrip5454@gmail.com',
  isAuthenticated: true,
};

let usersMap: Record<string, UserAuth> = {
  'user_1': currentUser,
};

// Initial sample emails for the default demo user
const initialEmails: EmailRecord[] = [
  {
    id: 'email_1',
    userId: 'user_1',
    to: 'rahul@gmail.com',
    subject: 'Meeting Reminder',
    body: 'Hi Rahul,\n\nJust a quick reminder about our sync tomorrow to review the quarterly milestones.\n\nBest,\nAdnan',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
    timezone: 'Asia/Kolkata',
    createdAt: new Date().toISOString(),
    senderEmail: 'manalitrip5454@gmail.com',
    senderName: 'Adnan Ahmed',
  },
  {
    id: 'email_2',
    userId: 'user_1',
    to: 'manager@gmail.com',
    subject: 'Project Update',
    body: 'Hi,\n\nI wanted to share the latest update on the project. We have completed the core delivery schedule and verified all milestones.\n\nThanks,\nAdnan',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // 36 hours from now
    timezone: 'Asia/Kolkata',
    createdAt: new Date().toISOString(),
    senderEmail: 'manalitrip5454@gmail.com',
    senderName: 'Adnan Ahmed',
  },
  {
    id: 'email_3',
    userId: 'user_1',
    to: 'team@gmail.com',
    subject: 'Sprint Kickoff Agenda',
    body: 'Hi team,\n\nHere is the agenda for our upcoming sprint planning session. Please review items prior to the call.\n\nRegards,\nAdnan',
    status: 'sent',
    scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    timezone: 'Asia/Kolkata',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    senderEmail: 'manalitrip5454@gmail.com',
    senderName: 'Adnan Ahmed',
  },
  {
    id: 'email_4',
    userId: 'user_1',
    to: 'client@company.com',
    subject: 'Proposal Review Summary',
    body: 'Hello,\n\nPlease find attached the final review document for the proposal.\n\nThanks,\nAdnan',
    status: 'sent',
    scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    timezone: 'Asia/Kolkata',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    senderEmail: 'manalitrip5454@gmail.com',
    senderName: 'Adnan Ahmed',
  },
];

function loadData() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      currentUser = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    } else {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(currentUser, null, 2));
    }
  } catch (e) {
    console.error('Error loading auth data:', e);
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      usersMap = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } else {
      usersMap = { [currentUser.id]: currentUser };
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersMap, null, 2));
    }
  } catch (e) {
    console.error('Error loading users map data:', e);
  }

  try {
    if (!fs.existsSync(EMAILS_FILE)) {
      fs.writeFileSync(EMAILS_FILE, JSON.stringify(initialEmails, null, 2));
    }
  } catch (e) {
    console.error('Error initializing emails data:', e);
  }
}

function getEmails(): EmailRecord[] {
  try {
    if (fs.existsSync(EMAILS_FILE)) {
      return JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading emails file:', e);
  }
  return initialEmails;
}

function saveEmails(emails: EmailRecord[]) {
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error('Error saving emails:', e);
  }
}

function saveAuth(user: UserAuth) {
  try {
    currentUser = user;
    usersMap[user.id] = user;
    fs.writeFileSync(AUTH_FILE, JSON.stringify(user, null, 2));
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersMap, null, 2));
  } catch (e) {
    console.error('Error saving auth:', e);
  }
}

loadData();

// --- Ethereal Email & Transporter Setup ---
let etherealTransporter: nodemailer.Transporter | null = null;
let etherealAccountInfo: { user: string; pass: string; webUrl?: string } | null = null;

const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpService = process.env.SMTP_SERVICE || (smtpHost ? undefined : 'gmail');

async function getTransporterForEmail(email?: EmailRecord): Promise<nodemailer.Transporter> {
  // 1. Direct custom SMTP configuration attached to email
  if (email?.smtpHost && email?.smtpUser && email?.smtpPass) {
    return nodemailer.createTransport({
      host: email.smtpHost,
      port: email.smtpPort || (email.smtpSecure ? 465 : 587),
      secure: email.smtpSecure ?? (email.smtpPort === 465),
      auth: {
        user: email.smtpUser,
        pass: email.smtpPass,
      },
    });
  }

  // 2. Direct Gmail credentials attached to email
  if (email?.gmailAppPassword && email?.senderEmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email.senderEmail,
        pass: email.gmailAppPassword,
      },
    });
  }

  // 3. Look up author user in usersMap by userId (custom SMTP or Gmail)
  if (email?.userId && usersMap[email.userId]) {
    const authorUser = usersMap[email.userId];
    if (authorUser.smtpHost && authorUser.smtpUser && authorUser.smtpPass) {
      return nodemailer.createTransport({
        host: authorUser.smtpHost,
        port: authorUser.smtpPort || (authorUser.smtpSecure ? 465 : 587),
        secure: authorUser.smtpSecure ?? (authorUser.smtpPort === 465),
        auth: {
          user: authorUser.smtpUser,
          pass: authorUser.smtpPass,
        },
      });
    }
    if (authorUser.gmailAppPassword && (authorUser.gmailEmail || authorUser.email)) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: authorUser.gmailEmail || authorUser.email,
          pass: authorUser.gmailAppPassword,
        },
      });
    }
  }

  // 4. If logged in current user has custom SMTP or dynamic Gmail credentials saved
  if (currentUser?.smtpHost && currentUser?.smtpUser && currentUser?.smtpPass) {
    return nodemailer.createTransport({
      host: currentUser.smtpHost,
      port: currentUser.smtpPort || (currentUser.smtpSecure ? 465 : 587),
      secure: currentUser.smtpSecure ?? (currentUser.smtpPort === 465),
      auth: {
        user: currentUser.smtpUser,
        pass: currentUser.smtpPass,
      },
    });
  }

  if (currentUser?.gmailAppPassword && (currentUser?.gmailEmail || currentUser?.email)) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: currentUser.gmailEmail || currentUser.email,
        pass: currentUser.gmailAppPassword,
      },
    });
  }

  // 5. If explicit environment variables are provided
  if (smtpUser && smtpPass) {
    if (smtpHost) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return nodemailer.createTransport({
      service: smtpService || 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // 6. If explicit Ethereal credentials are provided in env
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  // 7. Auto-provision an on-demand Ethereal test mailbox as fallback
  if (!etherealTransporter) {
    try {
      console.log('[Ethereal] Auto-creating test account...');
      const testAccount = await nodemailer.createTestAccount();
      etherealAccountInfo = {
        user: testAccount.user,
        pass: testAccount.pass,
        webUrl: 'https://ethereal.email',
      };
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Ethereal Ready] Test account created: ${testAccount.user}`);
    } catch (err) {
      console.warn('[Ethereal Warning] Fallback to JSON transport simulator:', err);
      etherealTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return etherealTransporter;
}

// Rate Limiter & Concurrency State
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_SEC) || 5;
const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY_LIMIT) || 2;

let activeDispatchesCount = 0;
let dispatchesInCurrentWindow = 0;
let windowStartTime = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStartTime >= RATE_LIMIT_WINDOW_MS) {
    windowStartTime = now;
    dispatchesInCurrentWindow = 0;
  }
  if (dispatchesInCurrentWindow >= RATE_LIMIT_MAX_PER_WINDOW) {
    return false; // Rate limit reached for this 1-second window
  }
  dispatchesInCurrentWindow++;
  return true;
}

// Email Dispatcher Function
async function sendActualEmail(
  email: EmailRecord
): Promise<{ success: boolean; error?: string; etherealUrl?: string }> {
  try {
    const transporter = await getTransporterForEmail(email);
    const senderFrom = email.senderEmail || currentUser.gmailEmail || currentUser.email || etherealAccountInfo?.user || 'manalitrip5454@gmail.com';
    
    const info = await transporter.sendMail({
      from: `"${email.senderName || 'Adnan'}" <${senderFrom}>`,
      to: email.to,
      subject: email.subject,
      text: email.body,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1a1a1a;">
          <h2 style="margin-top: 0; color: #1a1a1a;">${email.subject}</h2>
          <p style="white-space: pre-wrap; font-size: 14px;">${email.body}</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-top: 24px;" />
          <p style="font-size: 11px; color: #737373;">Dispatched dynamically by Automated Email Job Scheduler • Sender: ${senderFrom}</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`[Ethereal Preview URL] ${previewUrl}`);
    } else {
      console.log(`[Dispatched] Email #${email.id} to ${email.to} via dynamic sender ${senderFrom}`);
    }

    return { success: true, etherealUrl: previewUrl || undefined };
  } catch (err: any) {
    console.error(`[Email Send Error] Failed for #${email.id}:`, err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

// Background Worker with Concurrency Limit & Rate Limiting
let isWorkerChecking = false;
async function runBackgroundWorker() {
  if (isWorkerChecking) return;
  isWorkerChecking = true;

  try {
    const emails = getEmails();
    const now = new Date();
    const dueEmails = emails.filter(
      (e) => e.status === 'scheduled' && new Date(e.scheduledFor) <= now
    );

    if (dueEmails.length > 0) {
      // Process in batches respecting CONCURRENCY_LIMIT and RATE_LIMIT
      for (let i = 0; i < dueEmails.length; i += CONCURRENCY_LIMIT) {
        const batch = dueEmails.slice(i, i + CONCURRENCY_LIMIT);

        await Promise.all(
          batch.map(async (email) => {
            if (!checkRateLimit()) {
              console.log(`[Rate Limiter] Throttling email #${email.id}, deferring to next tick.`);
              return;
            }

            activeDispatchesCount++;
            try {
              console.log(
                `[Worker:Concurrency=${activeDispatchesCount}/${CONCURRENCY_LIMIT}] Dispatching email ${email.id} ("${email.subject}" -> ${email.to})`
              );
              const result = await sendActualEmail(email);

              if (result.success) {
                email.status = 'sent';
                email.sentAt = new Date().toISOString();
                if (result.etherealUrl) {
                  email.etherealUrl = result.etherealUrl;
                }
              } else {
                email.status = 'failed';
                email.failedReason = result.error || 'Dispatch error';
              }
            } finally {
              activeDispatchesCount--;
            }
          })
        );

        saveEmails(emails);
      }
    }
  } catch (err) {
    console.error('[Worker Loop Error]:', err);
  } finally {
    isWorkerChecking = false;
  }
}

// Start persistent server-side background worker loop (runs every 3 seconds)
setInterval(runBackgroundWorker, 3000);
console.log('Background Email Scheduler Worker active (Interval: 3000ms, Concurrency: 2, RateLimit: 5/s)');

// --- API Endpoints ---

// System Architecture & Queue Status Info
app.get('/api/system/info', (req, res) => {
  const emails = getEmails();
  const scheduledCount = emails.filter(e => e.status === 'scheduled').length;
  const sentCount = emails.filter(e => e.status === 'sent').length;
  const failedCount = emails.filter(e => e.status === 'failed').length;

  res.json({
    status: 'online',
    workerIntervalMs: 3000,
    concurrencyLimit: CONCURRENCY_LIMIT,
    rateLimitPerSec: RATE_LIMIT_MAX_PER_WINDOW,
    activeWorkers: activeDispatchesCount,
    transporterType: process.env.SMTP_USER
      ? 'Custom SMTP / Gmail'
      : etherealAccountInfo
      ? 'Ethereal Test Mailbox'
      : 'Ethereal Auto-Provisioning',
    etherealUser: etherealAccountInfo?.user || null,
    storageType: 'Durable Local JSON Storage (/data/emails.json)',
    stats: {
      scheduled: scheduledCount,
      sent: sentCount,
      failed: failedCount,
      total: emails.length,
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Auth
app.get('/api/auth/me', (req, res) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/login', (req, res) => {
  const { id, name, email, avatar, gmailAppPassword } = req.body;
  currentUser = {
    id: id || 'user_google_' + Date.now(),
    name: name || 'Adnan Ahmed',
    email: email || 'manalitrip5454@gmail.com',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    gmailConnected: true,
    gmailEmail: email || 'manalitrip5454@gmail.com',
    gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword || '',
    isAuthenticated: true,
  };
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/update-credentials', (req, res) => {
  const { gmailAppPassword, gmailEmail, name, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = req.body;
  if (gmailAppPassword !== undefined) {
    currentUser.gmailAppPassword = gmailAppPassword.trim();
  }
  if (gmailEmail) {
    currentUser.gmailEmail = gmailEmail.trim();
  }
  if (name) {
    currentUser.name = name.trim();
  }
  if (smtpHost !== undefined) {
    currentUser.smtpHost = smtpHost.trim();
  }
  if (smtpPort !== undefined) {
    currentUser.smtpPort = smtpPort ? parseInt(smtpPort, 10) : undefined;
  }
  if (smtpSecure !== undefined) {
    currentUser.smtpSecure = Boolean(smtpSecure);
  }
  if (smtpUser !== undefined) {
    currentUser.smtpUser = smtpUser.trim();
  }
  if (smtpPass !== undefined) {
    currentUser.smtpPass = smtpPass.trim();
  }
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/test-smtp', async (req, res) => {
  const { email, password, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = req.body;

  try {
    let testTransporter: nodemailer.Transporter;

    if (smtpHost && smtpUser && smtpPass) {
      testTransporter = nodemailer.createTransport({
        host: smtpHost.trim(),
        port: parseInt(smtpPort, 10) || 587,
        secure: smtpSecure !== undefined ? Boolean(smtpSecure) : (parseInt(smtpPort, 10) === 465),
        auth: {
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
        },
      });
    } else {
      const userToTest = email || currentUser.gmailEmail || currentUser.email;
      const passToTest = password || currentUser.gmailAppPassword;

      if (!passToTest) {
        return res.status(400).json({ error: 'Please provide a 16-character Gmail App Password or SMTP credentials to test.' });
      }

      testTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: userToTest,
          pass: passToTest,
        },
      });
    }

    await testTransporter.verify();
    res.json({ success: true, message: 'SMTP connection verified successfully! Ready to deliver real emails directly to recipients.' });
  } catch (err: any) {
    res.status(400).json({ 
      success: false, 
      error: err.message || 'SMTP Authentication failed. Please check your credentials (e.g., ensure 2FA is active and use a 16-character Google App Password).' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  currentUser.isAuthenticated = false;
  saveAuth(currentUser);
  res.json({ success: true });
});

app.post('/api/auth/toggle-gmail', (req, res) => {
  currentUser.gmailConnected = !currentUser.gmailConnected;
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});

// Emails CRUD & Scheduling
app.get('/api/emails', (req, res) => {
  const reqUserId = (req.query.userId as string) || (currentUser.isAuthenticated ? currentUser.id : undefined);
  const emails = getEmails();
  
  if (reqUserId) {
    const userEmails = emails.filter(e => e.userId === reqUserId);
    return res.json({ emails: userEmails });
  }

  res.json({ emails });
});

app.get('/api/stats', (req, res) => {
  const reqUserId = (req.query.userId as string) || (currentUser.isAuthenticated ? currentUser.id : undefined);
  const emails = getEmails();
  const scopedEmails = reqUserId ? emails.filter(e => e.userId === reqUserId) : emails;

  const scheduled = scopedEmails.filter(e => e.status === 'scheduled').length;
  const sent = scopedEmails.filter(e => e.status === 'sent').length;
  const failed = scopedEmails.filter(e => e.status === 'failed').length;
  res.json({ scheduled, sent, failed });
});

app.get('/api/recipients/recent', (req, res) => {
  const reqUserId = (req.query.userId as string) || (currentUser.isAuthenticated ? currentUser.id : undefined);
  const emails = getEmails();
  const scopedEmails = reqUserId ? emails.filter(e => e.userId === reqUserId) : emails;

  const recipients = Array.from(new Set(scopedEmails.map(e => e.to))).filter(Boolean).slice(0, 5);
  res.json({ recipients });
});

app.post('/api/emails/schedule', async (req, res) => {
  try {
    const { 
      to, subject, body, scheduledFor, timezone, senderEmail, senderName, 
      gmailAppPassword, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, userId 
    } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Please enter a subject.' });
    }
    if (!scheduledFor) {
      return res.status(400).json({ error: 'Please choose a scheduled time.' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduled time format.' });
    }

    if (scheduledDate.getTime() <= Date.now()) {
      return res.status(400).json({ 
        error: 'Scheduled time must be in the future. Cannot schedule emails for past dates or times.' 
      });
    }

    const newEmail: EmailRecord = {
      id: 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || '',
      status: 'scheduled',
      scheduledFor: scheduledDate.toISOString(),
      timezone: timezone || 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || 'User',
      gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword,
      smtpHost: smtpHost || currentUser.smtpHost,
      smtpPort: smtpPort || currentUser.smtpPort,
      smtpSecure: smtpSecure !== undefined ? smtpSecure : currentUser.smtpSecure,
      smtpUser: smtpUser || currentUser.smtpUser,
      smtpPass: smtpPass || currentUser.smtpPass,
    };

    const emails = getEmails();
    emails.unshift(newEmail);
    saveEmails(emails);

    console.log(`[API] Email scheduled for ${scheduledDate.toISOString()} (#${newEmail.id} to ${newEmail.to}) sender: ${newEmail.senderEmail}`);
    res.json({ success: true, email: newEmail });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to schedule email' });
  }
});

app.post('/api/emails/send-now', async (req, res) => {
  try {
    const { 
      to, subject, body, senderEmail, senderName, 
      gmailAppPassword, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, userId 
    } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Please enter a subject.' });
    }

    const newEmail: EmailRecord = {
      id: 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || '',
      status: 'sent',
      scheduledFor: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || 'User',
      gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword,
      smtpHost: smtpHost || currentUser.smtpHost,
      smtpPort: smtpPort || currentUser.smtpPort,
      smtpSecure: smtpSecure !== undefined ? smtpSecure : currentUser.smtpSecure,
      smtpUser: smtpUser || currentUser.smtpUser,
      smtpPass: smtpPass || currentUser.smtpPass,
    };

    const sendResult = await sendActualEmail(newEmail);
    if (!sendResult.success) {
      newEmail.status = 'failed';
      newEmail.failedReason = sendResult.error;
      const emails = getEmails();
      emails.unshift(newEmail);
      saveEmails(emails);
      return res.status(400).json({ 
        success: false, 
        error: sendResult.error || 'SMTP delivery failed. Please check your credentials.',
        email: newEmail 
      });
    }

    const emails = getEmails();
    emails.unshift(newEmail);
    saveEmails(emails);

    res.json({ 
      success: true, 
      email: newEmail, 
      message: `Email dispatched directly to ${newEmail.to}` 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

app.post('/api/emails/record', async (req, res) => {
  try {
    const { 
      id, to, subject, body, senderEmail, senderName, 
      status, sentAt, userId, deliveryMethod, googleMessageId 
    } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Recipient and subject are required.' });
    }

    const newEmail: EmailRecord = {
      id: id || 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || '',
      status: status || 'sent',
      scheduledFor: sentAt || new Date().toISOString(),
      sentAt: sentAt || new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || 'User',
    };

    const emails = getEmails();
    emails.unshift(newEmail);
    saveEmails(emails);

    console.log(`[Record] Recorded sent email #${newEmail.id} to ${newEmail.to} via ${deliveryMethod || 'Gmail API'}`);
    res.json({ success: true, email: newEmail });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record email' });
  }
});

app.post('/api/emails/:id/cancel', (req, res) => {
  const { id } = req.params;
  const emails = getEmails();
  const target = emails.find(e => e.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Email not found.' });
  }

  if (target.status !== 'scheduled') {
    return res.status(400).json({ error: 'Only scheduled emails can be cancelled.' });
  }

  target.status = 'cancelled';
  saveEmails(emails);
  res.json({ success: true, email: target });
});

app.post('/api/emails/:id/retry', async (req, res) => {
  const { id } = req.params;
  const emails = getEmails();
  const target = emails.find(e => e.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Email not found.' });
  }

  target.status = 'scheduled';
  target.scheduledFor = new Date(Date.now() + 1000 * 5).toISOString(); // retry in 5 seconds
  target.failedReason = undefined;
  saveEmails(emails);

  res.json({ success: true, email: target });
});

app.delete('/api/emails/:id', (req, res) => {
  const { id } = req.params;
  let emails = getEmails();
  emails = emails.filter(e => e.id !== id);
  saveEmails(emails);
  res.json({ success: true });
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Email Job Scheduler Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
