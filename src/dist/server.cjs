
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json());
var DATA_DIR = import_path.default.join(process.cwd(), "data");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var EMAILS_FILE = import_path.default.join(DATA_DIR, "emails.json");
var AUTH_FILE = import_path.default.join(DATA_DIR, "auth.json");
var USERS_FILE = import_path.default.join(DATA_DIR, "users.json");
var currentUser = {
  id: "user_1",
  name: "Adnan Ahmed",
  email: "manalitrip5454@gmail.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  gmailConnected: true,
  gmailEmail: "manalitrip5454@gmail.com",
  isAuthenticated: true
};
var usersMap = {
  "user_1": currentUser
};
var initialEmails = [
  {
    id: "email_1",
    userId: "user_1",
    to: "rahul@gmail.com",
    subject: "Meeting Reminder",
    body: "Hi Rahul,\n\nJust a quick reminder about our sync tomorrow to review the quarterly milestones.\n\nBest,\nAdnan",
    status: "scheduled",
    scheduledFor: new Date(Date.now() + 1e3 * 60 * 60 * 12).toISOString(),
    // 12 hours from now
    timezone: "Asia/Kolkata",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    senderEmail: "manalitrip5454@gmail.com",
    senderName: "Adnan Ahmed"
  },
  {
    id: "email_2",
    userId: "user_1",
    to: "manager@gmail.com",
    subject: "Project Update",
    body: "Hi,\n\nI wanted to share the latest update on the project. We have completed the core delivery schedule and verified all milestones.\n\nThanks,\nAdnan",
    status: "scheduled",
    scheduledFor: new Date(Date.now() + 1e3 * 60 * 60 * 36).toISOString(),
    // 36 hours from now
    timezone: "Asia/Kolkata",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    senderEmail: "manalitrip5454@gmail.com",
    senderName: "Adnan Ahmed"
  },
  {
    id: "email_3",
    userId: "user_1",
    to: "team@gmail.com",
    subject: "Sprint Kickoff Agenda",
    body: "Hi team,\n\nHere is the agenda for our upcoming sprint planning session. Please review items prior to the call.\n\nRegards,\nAdnan",
    status: "sent",
    scheduledFor: new Date(Date.now() - 1e3 * 60 * 60 * 24).toISOString(),
    sentAt: new Date(Date.now() - 1e3 * 60 * 60 * 24).toISOString(),
    timezone: "Asia/Kolkata",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 48).toISOString(),
    senderEmail: "manalitrip5454@gmail.com",
    senderName: "Adnan Ahmed"
  },
  {
    id: "email_4",
    userId: "user_1",
    to: "client@company.com",
    subject: "Proposal Review Summary",
    body: "Hello,\n\nPlease find attached the final review document for the proposal.\n\nThanks,\nAdnan",
    status: "sent",
    scheduledFor: new Date(Date.now() - 1e3 * 60 * 60 * 72).toISOString(),
    sentAt: new Date(Date.now() - 1e3 * 60 * 60 * 72).toISOString(),
    timezone: "Asia/Kolkata",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 96).toISOString(),
    senderEmail: "manalitrip5454@gmail.com",
    senderName: "Adnan Ahmed"
  }
];
function loadData() {
  try {
    if (import_fs.default.existsSync(AUTH_FILE)) {
      currentUser = JSON.parse(import_fs.default.readFileSync(AUTH_FILE, "utf-8"));
    } else {
      import_fs.default.writeFileSync(AUTH_FILE, JSON.stringify(currentUser, null, 2));
    }
  } catch (e) {
    console.error("Error loading auth data:", e);
  }
  try {
    if (import_fs.default.existsSync(USERS_FILE)) {
      usersMap = JSON.parse(import_fs.default.readFileSync(USERS_FILE, "utf-8"));
    } else {
      usersMap = { [currentUser.id]: currentUser };
      import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(usersMap, null, 2));
    }
  } catch (e) {
    console.error("Error loading users map data:", e);
  }
  try {
    if (!import_fs.default.existsSync(EMAILS_FILE)) {
      import_fs.default.writeFileSync(EMAILS_FILE, JSON.stringify(initialEmails, null, 2));
    }
  } catch (e) {
    console.error("Error initializing emails data:", e);
  }
}
function getEmails() {
  try {
    if (import_fs.default.existsSync(EMAILS_FILE)) {
      return JSON.parse(import_fs.default.readFileSync(EMAILS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading emails file:", e);
  }
  return initialEmails;
}
function saveEmails(emails) {
  try {
    import_fs.default.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error("Error saving emails:", e);
  }
}
function saveAuth(user) {
  try {
    currentUser = user;
    usersMap[user.id] = user;
    import_fs.default.writeFileSync(AUTH_FILE, JSON.stringify(user, null, 2));
    import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(usersMap, null, 2));
  } catch (e) {
    console.error("Error saving auth:", e);
  }
}
loadData();
var etherealTransporter = null;
var etherealAccountInfo = null;
var smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
var smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
var smtpHost = process.env.SMTP_HOST;
var smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : void 0;
var smtpService = process.env.SMTP_SERVICE || (smtpHost ? void 0 : "gmail");
async function getTransporterForEmail(email) {
  if (email?.smtpHost && email?.smtpUser && email?.smtpPass) {
    return import_nodemailer.default.createTransport({
      host: email.smtpHost,
      port: email.smtpPort || (email.smtpSecure ? 465 : 587),
      secure: email.smtpSecure ?? email.smtpPort === 465,
      auth: {
        user: email.smtpUser,
        pass: email.smtpPass
      }
    });
  }
  if (email?.gmailAppPassword && email?.senderEmail) {
    return import_nodemailer.default.createTransport({
      service: "gmail",
      auth: {
        user: email.senderEmail,
        pass: email.gmailAppPassword
      }
    });
  }
  if (email?.userId && usersMap[email.userId]) {
    const authorUser = usersMap[email.userId];
    if (authorUser.smtpHost && authorUser.smtpUser && authorUser.smtpPass) {
      return import_nodemailer.default.createTransport({
        host: authorUser.smtpHost,
        port: authorUser.smtpPort || (authorUser.smtpSecure ? 465 : 587),
        secure: authorUser.smtpSecure ?? authorUser.smtpPort === 465,
        auth: {
          user: authorUser.smtpUser,
          pass: authorUser.smtpPass
        }
      });
    }
    if (authorUser.gmailAppPassword && (authorUser.gmailEmail || authorUser.email)) {
      return import_nodemailer.default.createTransport({
        service: "gmail",
        auth: {
          user: authorUser.gmailEmail || authorUser.email,
          pass: authorUser.gmailAppPassword
        }
      });
    }
  }
  if (currentUser?.smtpHost && currentUser?.smtpUser && currentUser?.smtpPass) {
    return import_nodemailer.default.createTransport({
      host: currentUser.smtpHost,
      port: currentUser.smtpPort || (currentUser.smtpSecure ? 465 : 587),
      secure: currentUser.smtpSecure ?? currentUser.smtpPort === 465,
      auth: {
        user: currentUser.smtpUser,
        pass: currentUser.smtpPass
      }
    });
  }
  if (currentUser?.gmailAppPassword && (currentUser?.gmailEmail || currentUser?.email)) {
    return import_nodemailer.default.createTransport({
      service: "gmail",
      auth: {
        user: currentUser.gmailEmail || currentUser.email,
        pass: currentUser.gmailAppPassword
      }
    });
  }
  if (smtpUser && smtpPass) {
    if (smtpHost) {
      return import_nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    }
    return import_nodemailer.default.createTransport({
      service: smtpService || "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return import_nodemailer.default.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      }
    });
  }
  if (!etherealTransporter) {
    try {
      console.log("[Ethereal] Auto-creating test account...");
      const testAccount = await import_nodemailer.default.createTestAccount();
      etherealAccountInfo = {
        user: testAccount.user,
        pass: testAccount.pass,
        webUrl: "https://ethereal.email"
      };
      etherealTransporter = import_nodemailer.default.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[Ethereal Ready] Test account created: ${testAccount.user}`);
    } catch (err) {
      console.warn("[Ethereal Warning] Fallback to JSON transport simulator:", err);
      etherealTransporter = import_nodemailer.default.createTransport({
        jsonTransport: true
      });
    }
  }
  return etherealTransporter;
}
var RATE_LIMIT_WINDOW_MS = 1e3;
var RATE_LIMIT_MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_SEC) || 5;
var CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY_LIMIT) || 2;
var activeDispatchesCount = 0;
var dispatchesInCurrentWindow = 0;
var windowStartTime = Date.now();
function checkRateLimit() {
  const now = Date.now();
  if (now - windowStartTime >= RATE_LIMIT_WINDOW_MS) {
    windowStartTime = now;
    dispatchesInCurrentWindow = 0;
  }
  if (dispatchesInCurrentWindow >= RATE_LIMIT_MAX_PER_WINDOW) {
    return false;
  }
  dispatchesInCurrentWindow++;
  return true;
}
async function sendActualEmail(email) {
  try {
    const transporter = await getTransporterForEmail(email);
    const senderFrom = email.senderEmail || currentUser.gmailEmail || currentUser.email || etherealAccountInfo?.user || "manalitrip5454@gmail.com";
    const info = await transporter.sendMail({
      from: `"${email.senderName || "Adnan"}" <${senderFrom}>`,
      to: email.to,
      subject: email.subject,
      text: email.body,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1a1a1a;">
          <h2 style="margin-top: 0; color: #1a1a1a;">${email.subject}</h2>
          <p style="white-space: pre-wrap; font-size: 14px;">${email.body}</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-top: 24px;" />
          <p style="font-size: 11px; color: #737373;">Dispatched dynamically by Automated Email Job Scheduler \u2022 Sender: ${senderFrom}</p>
        </div>
      `
    });
    const previewUrl = import_nodemailer.default.getTestMessageUrl(info) || void 0;
    if (previewUrl) {
      console.log(`[Ethereal Preview URL] ${previewUrl}`);
    } else {
      console.log(`[Dispatched] Email #${email.id} to ${email.to} via dynamic sender ${senderFrom}`);
    }
    return { success: true, etherealUrl: previewUrl || void 0 };
  } catch (err) {
    console.error(`[Email Send Error] Failed for #${email.id}:`, err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}
var isWorkerChecking = false;
async function runBackgroundWorker() {
  if (isWorkerChecking) return;
  isWorkerChecking = true;
  try {
    const emails = getEmails();
    const now = /* @__PURE__ */ new Date();
    const dueEmails = emails.filter(
      (e) => e.status === "scheduled" && new Date(e.scheduledFor) <= now
    );
    if (dueEmails.length > 0) {
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
                email.status = "sent";
                email.sentAt = (/* @__PURE__ */ new Date()).toISOString();
                if (result.etherealUrl) {
                  email.etherealUrl = result.etherealUrl;
                }
              } else {
                email.status = "failed";
                email.failedReason = result.error || "Dispatch error";
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
    console.error("[Worker Loop Error]:", err);
  } finally {
    isWorkerChecking = false;
  }
}
setInterval(runBackgroundWorker, 3e3);
console.log("Background Email Scheduler Worker active (Interval: 3000ms, Concurrency: 2, RateLimit: 5/s)");
app.get("/api/system/info", (req, res) => {
  const emails = getEmails();
  const scheduledCount = emails.filter((e) => e.status === "scheduled").length;
  const sentCount = emails.filter((e) => e.status === "sent").length;
  const failedCount = emails.filter((e) => e.status === "failed").length;
  res.json({
    status: "online",
    workerIntervalMs: 3e3,
    concurrencyLimit: CONCURRENCY_LIMIT,
    rateLimitPerSec: RATE_LIMIT_MAX_PER_WINDOW,
    activeWorkers: activeDispatchesCount,
    transporterType: process.env.SMTP_USER ? "Custom SMTP / Gmail" : etherealAccountInfo ? "Ethereal Test Mailbox" : "Ethereal Auto-Provisioning",
    etherealUser: etherealAccountInfo?.user || null,
    storageType: "Durable Local JSON Storage (/data/emails.json)",
    stats: {
      scheduled: scheduledCount,
      sent: sentCount,
      failed: failedCount,
      total: emails.length
    },
    uptimeSeconds: Math.floor(process.uptime())
  });
});
app.get("/api/auth/me", (req, res) => {
  res.json({ user: currentUser });
});
app.post("/api/auth/login", (req, res) => {
  const { id, name, email, avatar, gmailAppPassword } = req.body;
  currentUser = {
    id: id || "user_google_" + Date.now(),
    name: name || "Adnan Ahmed",
    email: email || "manalitrip5454@gmail.com",
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    gmailConnected: true,
    gmailEmail: email || "manalitrip5454@gmail.com",
    gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword || "",
    isAuthenticated: true
  };
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});
app.post("/api/auth/update-credentials", (req, res) => {
  const { gmailAppPassword, gmailEmail, name, smtpHost: smtpHost2, smtpPort: smtpPort2, smtpSecure, smtpUser: smtpUser2, smtpPass: smtpPass2 } = req.body;
  if (gmailAppPassword !== void 0) {
    currentUser.gmailAppPassword = gmailAppPassword.trim();
  }
  if (gmailEmail) {
    currentUser.gmailEmail = gmailEmail.trim();
  }
  if (name) {
    currentUser.name = name.trim();
  }
  if (smtpHost2 !== void 0) {
    currentUser.smtpHost = smtpHost2.trim();
  }
  if (smtpPort2 !== void 0) {
    currentUser.smtpPort = smtpPort2 ? parseInt(smtpPort2, 10) : void 0;
  }
  if (smtpSecure !== void 0) {
    currentUser.smtpSecure = Boolean(smtpSecure);
  }
  if (smtpUser2 !== void 0) {
    currentUser.smtpUser = smtpUser2.trim();
  }
  if (smtpPass2 !== void 0) {
    currentUser.smtpPass = smtpPass2.trim();
  }
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});
app.post("/api/auth/test-smtp", async (req, res) => {
  const { email, password, smtpHost: smtpHost2, smtpPort: smtpPort2, smtpSecure, smtpUser: smtpUser2, smtpPass: smtpPass2 } = req.body;
  try {
    let testTransporter;
    if (smtpHost2 && smtpUser2 && smtpPass2) {
      testTransporter = import_nodemailer.default.createTransport({
        host: smtpHost2.trim(),
        port: parseInt(smtpPort2, 10) || 587,
        secure: smtpSecure !== void 0 ? Boolean(smtpSecure) : parseInt(smtpPort2, 10) === 465,
        auth: {
          user: smtpUser2.trim(),
          pass: smtpPass2.trim()
        }
      });
    } else {
      const userToTest = email || currentUser.gmailEmail || currentUser.email;
      const passToTest = password || currentUser.gmailAppPassword;
      if (!passToTest) {
        return res.status(400).json({ error: "Please provide a 16-character Gmail App Password or SMTP credentials to test." });
      }
      testTransporter = import_nodemailer.default.createTransport({
        service: "gmail",
        auth: {
          user: userToTest,
          pass: passToTest
        }
      });
    }
    await testTransporter.verify();
    res.json({ success: true, message: "SMTP connection verified successfully! Ready to deliver real emails directly to recipients." });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || "SMTP Authentication failed. Please check your credentials (e.g., ensure 2FA is active and use a 16-character Google App Password)."
    });
  }
});
app.post("/api/auth/logout", (req, res) => {
  currentUser.isAuthenticated = false;
  saveAuth(currentUser);
  res.json({ success: true });
});
app.post("/api/auth/toggle-gmail", (req, res) => {
  currentUser.gmailConnected = !currentUser.gmailConnected;
  saveAuth(currentUser);
  res.json({ success: true, user: currentUser });
});
app.get("/api/emails", (req, res) => {
  const reqUserId = req.query.userId || (currentUser.isAuthenticated ? currentUser.id : void 0);
  const emails = getEmails();
  if (reqUserId) {
    const userEmails = emails.filter((e) => e.userId === reqUserId);
    return res.json({ emails: userEmails });
  }
  res.json({ emails });
});
app.get("/api/stats", (req, res) => {
  const reqUserId = req.query.userId || (currentUser.isAuthenticated ? currentUser.id : void 0);
  const emails = getEmails();
  const scopedEmails = reqUserId ? emails.filter((e) => e.userId === reqUserId) : emails;
  const scheduled = scopedEmails.filter((e) => e.status === "scheduled").length;
  const sent = scopedEmails.filter((e) => e.status === "sent").length;
  const failed = scopedEmails.filter((e) => e.status === "failed").length;
  res.json({ scheduled, sent, failed });
});
app.get("/api/recipients/recent", (req, res) => {
  const reqUserId = req.query.userId || (currentUser.isAuthenticated ? currentUser.id : void 0);
  const emails = getEmails();
  const scopedEmails = reqUserId ? emails.filter((e) => e.userId === reqUserId) : emails;
  const recipients = Array.from(new Set(scopedEmails.map((e) => e.to))).filter(Boolean).slice(0, 5);
  res.json({ recipients });
});
app.post("/api/emails/schedule", async (req, res) => {
  try {
    const {
      to,
      subject,
      body,
      scheduledFor,
      timezone,
      senderEmail,
      senderName,
      gmailAppPassword,
      smtpHost: smtpHost2,
      smtpPort: smtpPort2,
      smtpSecure,
      smtpUser: smtpUser2,
      smtpPass: smtpPass2,
      userId
    } = req.body;
    if (!to || !to.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!subject) {
      return res.status(400).json({ error: "Please enter a subject." });
    }
    if (!scheduledFor) {
      return res.status(400).json({ error: "Please choose a scheduled time." });
    }
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: "Invalid scheduled time format." });
    }
    if (scheduledDate.getTime() <= Date.now()) {
      return res.status(400).json({
        error: "Scheduled time must be in the future. Cannot schedule emails for past dates or times."
      });
    }
    const newEmail = {
      id: "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || "",
      status: "scheduled",
      scheduledFor: scheduledDate.toISOString(),
      timezone: timezone || "Asia/Kolkata",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || "User",
      gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword,
      smtpHost: smtpHost2 || currentUser.smtpHost,
      smtpPort: smtpPort2 || currentUser.smtpPort,
      smtpSecure: smtpSecure !== void 0 ? smtpSecure : currentUser.smtpSecure,
      smtpUser: smtpUser2 || currentUser.smtpUser,
      smtpPass: smtpPass2 || currentUser.smtpPass
    };
    const emails = getEmails();
    emails.unshift(newEmail);
    saveEmails(emails);
    console.log(`[API] Email scheduled for ${scheduledDate.toISOString()} (#${newEmail.id} to ${newEmail.to}) sender: ${newEmail.senderEmail}`);
    res.json({ success: true, email: newEmail });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to schedule email" });
  }
});
app.post("/api/emails/send-now", async (req, res) => {
  try {
    const {
      to,
      subject,
      body,
      senderEmail,
      senderName,
      gmailAppPassword,
      smtpHost: smtpHost2,
      smtpPort: smtpPort2,
      smtpSecure,
      smtpUser: smtpUser2,
      smtpPass: smtpPass2,
      userId
    } = req.body;
    if (!to || !to.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!subject) {
      return res.status(400).json({ error: "Please enter a subject." });
    }
    const newEmail = {
      id: "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || "",
      status: "sent",
      scheduledFor: (/* @__PURE__ */ new Date()).toISOString(),
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      timezone: "Asia/Kolkata",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || "User",
      gmailAppPassword: gmailAppPassword || currentUser.gmailAppPassword,
      smtpHost: smtpHost2 || currentUser.smtpHost,
      smtpPort: smtpPort2 || currentUser.smtpPort,
      smtpSecure: smtpSecure !== void 0 ? smtpSecure : currentUser.smtpSecure,
      smtpUser: smtpUser2 || currentUser.smtpUser,
      smtpPass: smtpPass2 || currentUser.smtpPass
    };
    const sendResult = await sendActualEmail(newEmail);
    if (!sendResult.success) {
      newEmail.status = "failed";
      newEmail.failedReason = sendResult.error;
      const emails2 = getEmails();
      emails2.unshift(newEmail);
      saveEmails(emails2);
      return res.status(400).json({
        success: false,
        error: sendResult.error || "SMTP delivery failed. Please check your credentials.",
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
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});
app.post("/api/emails/record", async (req, res) => {
  try {
    const {
      id,
      to,
      subject,
      body,
      senderEmail,
      senderName,
      status,
      sentAt,
      userId,
      deliveryMethod,
      googleMessageId
    } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ error: "Recipient and subject are required." });
    }
    const newEmail = {
      id: id || "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      userId: userId || currentUser.id,
      to: to.trim(),
      subject: subject.trim(),
      body: body || "",
      status: status || "sent",
      scheduledFor: sentAt || (/* @__PURE__ */ new Date()).toISOString(),
      sentAt: sentAt || (/* @__PURE__ */ new Date()).toISOString(),
      timezone: "Asia/Kolkata",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      senderEmail: senderEmail || currentUser.gmailEmail || currentUser.email,
      senderName: senderName || currentUser.name || "User"
    };
    const emails = getEmails();
    emails.unshift(newEmail);
    saveEmails(emails);
    console.log(`[Record] Recorded sent email #${newEmail.id} to ${newEmail.to} via ${deliveryMethod || "Gmail API"}`);
    res.json({ success: true, email: newEmail });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to record email" });
  }
});
app.post("/api/emails/:id/cancel", (req, res) => {
  const { id } = req.params;
  const emails = getEmails();
  const target = emails.find((e) => e.id === id);
  if (!target) {
    return res.status(404).json({ error: "Email not found." });
  }
  if (target.status !== "scheduled") {
    return res.status(400).json({ error: "Only scheduled emails can be cancelled." });
  }
  target.status = "cancelled";
  saveEmails(emails);
  res.json({ success: true, email: target });
});
app.post("/api/emails/:id/retry", async (req, res) => {
  const { id } = req.params;
  const emails = getEmails();
  const target = emails.find((e) => e.id === id);
  if (!target) {
    return res.status(404).json({ error: "Email not found." });
  }
  target.status = "scheduled";
  target.scheduledFor = new Date(Date.now() + 1e3 * 5).toISOString();
  target.failedReason = void 0;
  saveEmails(emails);
  res.json({ success: true, email: target });
});
app.delete("/api/emails/:id", (req, res) => {
  const { id } = req.params;
  let emails = getEmails();
  emails = emails.filter((e) => e.id !== id);
  saveEmails(emails);
  res.json({ success: true });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Email Job Scheduler Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
