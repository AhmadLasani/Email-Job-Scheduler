#  Autonomous Email Job Scheduler & Real-Time Outreach Platform

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38b2ac?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-9.1-008080?style=flat-square)](https://nodemailer.com)
[![Firebase](https://img.shields.io/badge/Firebase-12.18-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com)

A production-grade, full-stack scheduled email dispatch and outreach platform. Compose emails now, schedule them for any exact future date/time, and have them delivered automatically by an autonomous server-side background worker daemon — even when your browser or computer is closed.

Supports **Dual-Engine Email Dispatch**: Native Google OAuth (Gmail REST API) for direct authorized inbox sending, and robust SMTP (Google App Passwords or Custom Mail Server) via Nodemailer.

---

##  Table of Contents

- [Features](#-features)
- [Architecture & Workflow](#-architecture--workflow)
- [Tech Stack](#-tech-stack)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [How to Set Up Gmail & SMTP](#-how-to-set-up-gmail--smtp)
- [API Reference](#-api-reference)
- [Production Deployment](#-production-deployment)
  - [Deploy on Render](#deploy-on-render-recommended)
  - [Deploy on Google Cloud Run](#deploy-on-google-cloud-run)
  - [Deploy on Railway / VPS](#deploy-on-railway--vps)
- [Background Worker & Rate Limiting](#-background-worker--rate-limiting)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

##  Features

###  Reliable Email Scheduling & Queuing
- **Custom Future Timestamps**: Schedule emails down to the exact minute across any timezone.
- **Convenient Presets**: 1-click scheduling (+1 Hour, +4 Hours, Tomorrow Morning at 9:00 AM, Next Week).
- **Persistent Job Storage**: Scheduled emails persist safely in durable storage (`/data/emails.json`), ensuring jobs survive server restarts.
- **Cancel & 1-Click Retry**: Cancel scheduled emails before dispatch or instantly retry failed dispatches.

###  Dual-Engine Delivery System
- **Google OAuth (Gmail REST API)**: Direct RFC 2822 Base64-encoded dispatch via `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`. Emails appear natively in the sender's authentic "Sent" mailbox.
- **Custom SMTP & Gmail App Passwords**: Authenticate with standard SMTP credentials (host, port, SSL/TLS, username, password) or a 16-character Google App Password.
- **Zero-Config Ethereal Fallback**: When no credentials are provided during testing, the server automatically provisions a temporary Ethereal test inbox with instant browser preview URLs.

###  Rate Limiting & Concurrency Control
- **Token Bucket Rate Limiter**: Configurable per-second dispatch limits (`RATE_LIMIT_PER_SEC=5`) to protect domain reputation and prevent anti-spam trigger flags.
- **Controlled Concurrency**: Batch processing limit (`CONCURRENCY_LIMIT=2`) ensures predictable memory and network throughput.

###  Real-Time Analytics & Monitoring
- **Live Status Badges**: Real-time counts for **Scheduled**, **Sent**, and **Failed** dispatches.
- **Failure Reason Recording**: Catches exact SMTP errors (e.g., `550 Invalid Recipient`, `535 Authentication Credentials Invalid`) and displays actionable remediation steps.
- **Recent Recipients Auto-Fill**: Remembers previous contacts for rapid outreach composition.
- **Live Diagnostic Dashboard**: View worker status, uptime, queue volume, and active transporter type at `/api/system/info`.

---

##  Architecture & Workflow

```text
┌────────────────────────────────────────────────────────┐
│               React 19 Frontend (Vite)                │
│  - Compose View (Date/Time Picker, Presets, Recents)   │
│  - Scheduled / Sent / Failed Dashboards                │
│  - Google OAuth Sign-in & In-Composer SMTP Setup       │
└──────────────────────────┬─────────────────────────────┘
                           │
             REST API Calls /api/emails/*
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               Express Backend (Node.js)               │
│  - Authentication State (/data/auth.json)              │
│  - Durable Email Queue (/data/emails.json)             │
│  - System Health Diagnostics (/api/system/info)        │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
    Instant "Send Now"             Every 3 Seconds
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ Direct Dispatch Pipeline│   │ Background Worker Daemon │
│  - OAuth Gmail REST API │   │ - Polls scheduled jobs   │
│  - SMTP Nodemailer Pool │   │ - Checks rate limiter    │
└────────────┬────────────┘   │ - Batches by concurrency │
             │                └────────────┬─────────────┘
             │                             │
             ▼                             ▼
    ┌──────────────────────────────────────────────┐
    │              Recipient Inbox                 │
    │  (Delivered with full HTML & text payload)   │
    └──────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Domain | Technology | Details |
|---|---|---|
| **Frontend UI** | **React 19, Tailwind CSS v4** | Interactive single-page app with fluid animations via `motion` |
| **Icons** | **lucide-react** | Clean, accessible iconography |
| **Backend** | **Node.js, Express 4.21, TypeScript 5.8** | RESTful routing with JSON body parsing & CORS support |
| **Email Engine** | **Nodemailer 9.1 & Google Gmail API** | Dual SMTP + REST API email dispatch with MIME RFC 2822 encoding |
| **Auth & DB** | **Firebase 12.18 / Durable JSON** | Google Identity Services OAuth + persistent filesystem storage |
| **Bundler & Dev** | **Vite 6, tsx, esbuild** | Near-instant HMR and single-artifact CommonJS backend build |

---

##  Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher

### 2. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/email-job-scheduler.git
cd email-job-scheduler

# Install dependencies
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
*(See the [Configuration](#-configuration--environment-variables) section below for optional keys).*

### 4. Run the Application
```bash
# Start backend server and Vite frontend concurrently
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

>  **Tip**: Even with zero configuration, the app runs out-of-the-box using the auto-provisioned **Ethereal Mailbox** simulator so you can test scheduling immediately!

---

##  Configuration & Environment Variables

All variables are optional. If omitted, default fallbacks and dynamic in-app user settings are used.

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | `number` | `3000` | Port for the Express server and Vite reverse proxy |
| `NODE_ENV` | `string` | `development` | Environment mode (`development` or `production`) |
| `GMAIL_USER` | `string` | — | Fallback Gmail sender address (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD` | `string` | — | 16-character Google App Password |
| `SMTP_HOST` | `string` | — | Custom SMTP host (e.g. `smtp.sendgrid.net`, `smtp.mailgun.org`) |
| `SMTP_PORT` | `number` | `587` | Custom SMTP port (`465` for SSL, `587` for TLS) |
| `SMTP_USER` | `string` | — | Custom SMTP authentication username |
| `SMTP_PASS` | `string` | — | Custom SMTP authentication password |
| `RATE_LIMIT_PER_SEC`| `number` | `5` | Maximum outgoing emails allowed per 1-second window |
| `CONCURRENCY_LIMIT` | `number` | `2` | Maximum concurrent email dispatches running in parallel |
| `GEMINI_API_KEY` | `string` | — | Optional Google GenAI API key for AI email copy assistance |

---

##  How to Set Up Gmail & SMTP

To deliver emails directly to real recipient inboxes from your Gmail account:

### Method 1: Google App Password (Recommended & Quickest)
1. Navigate to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. In the search bar at the top, type **App passwords** (or go directly to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Enter an app name, e.g., `Email Scheduler`, and click **Create**.
5. Google will generate a **16-character password** (format: `xxxx xxxx xxxx xxxx`).
6. Copy this password:
   - Paste it into the in-app **Composer Settings** / **Settings View**, OR
   - Add it to your `.env` as `GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx`.
7. Click **Verify Connection** in the app. You're ready to send!

### Method 2: Custom SMTP Server
You can connect SendGrid, Mailgun, Amazon SES, Postmark, or your own private mail server:
1. Open the **Composer** or **Settings** view in the web UI.
2. Select **Custom SMTP Server**.
3. Fill in:
   - **Host**: e.g., `smtp.sendgrid.net`
   - **Port**: `587` (or `465` with SSL enabled)
   - **Username**: `apikey` (or your SMTP username)
   - **Password**: Your SMTP API secret/password
4. Click **Test SMTP Connection** to verify live handshake.

---

##  API Reference

### System & Diagnostics
```http
GET /api/system/info
```
Returns worker state, concurrency limits, queue counts, transporter type, and server uptime.

---

### Emails Management

#### 1. Fetch All Emails
```http
GET /api/emails?userId=user_1
```
Returns a list of emails filtered optionally by `userId`.

#### 2. Schedule an Email
```http
POST /api/emails/schedule
Content-Type: application/json
```
```json
{
  "to": "client@example.com",
  "subject": "Q3 Milestone Review",
  "body": "Hi team,\nHere is the milestone update.",
  "scheduledFor": "2026-09-03T10:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "senderEmail": "you@gmail.com",
  "senderName": "Your Name"
}
```

#### 3. Send Immediately
```http
POST /api/emails/send-now
Content-Type: application/json
```
Dispatches the email right away through the configured transporter without queuing.

#### 4. Cancel a Scheduled Email
```http
POST /api/emails/:id/cancel
```
Transitions status from `scheduled` to `cancelled`.

#### 5. Retry a Failed Email
```http
POST /api/emails/:id/retry
```
Resets status to `scheduled` and sets `scheduledFor` to 5 seconds from now for immediate retry.

#### 6. Delete an Email Record
```http
DELETE /api/emails/:id
```
Permanently deletes the email record from storage.

---

### Credentials & Verification
```http
POST /api/auth/test-smtp
Content-Type: application/json
```
```json
{
  "email": "you@gmail.com",
  "password": "xxxx xxxx xxxx xxxx"
}
```
Verifies SMTP handshake against the mail server and returns `{ success: true }` or the specific authentication error.

---

##  Production Deployment

The project compiles the frontend into static assets and bundles the Express backend into a standalone, production-ready CommonJS file (`dist/server.cjs`).

### Deploy on Render (Recommended)

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `email-job-scheduler`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=3000
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_digit_app_password
   ```
6. Click **Deploy Web Service**.

---

### Deploy on Google Cloud Run

Build and deploy directly via the Google Cloud CLI:
```bash
# Build and deploy from source
gcloud run deploy email-job-scheduler \
  --source . \
  --port 3000 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

---

### Deploy on Railway or VPS
1. Set the **Build Command** to: `npm run build`
2. Set the **Start Command** to: `npm start`
3. Expose port `3000`.

---

## Background Worker & Rate Limiting

The scheduler uses an internal, non-blocking asynchronous event loop:

1. **Cycle Interval**: Executes every **3,000 milliseconds** (3 seconds).
2. **Query Evaluation**: Reads `/data/emails.json` for records where `status === 'scheduled'` and `new Date(scheduledFor) <= new Date()`.
3. **Batching**: Partitions pending emails by `CONCURRENCY_LIMIT` (default: `2`).
4. **Rate Limiting**: Checks `RATE_LIMIT_MAX_PER_WINDOW` (default: `5` emails/sec). If the current window is full, the email remains `scheduled` and is deferred to the next tick.
5. **State Transition**:
   - ✅ Success: Sets `status = 'sent'`, records `sentAt = ISO_STRING`.
   - ❌ Error: Sets `status = 'failed'`, records `failedReason = error.message`.

---

##  Troubleshooting & FAQ

#### 1. "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Cause**: Using your normal Google account password instead of an App Password, or 2-Step Verification is disabled.
- **Solution**: Go to [Google App Passwords](https://myaccount.google.com/apppasswords), generate a 16-character App Password, and use that as `GMAIL_APP_PASSWORD`.

#### 2. "Emails are stuck in 'scheduled' status"
- Verify that your system time is accurate.
- Check the server logs (`npm run dev`) to ensure the background worker printed `[Worker Loop]`.
- Visit `http://localhost:3000/api/system/info` to confirm worker status is `online`.

#### 3. "Port 3000 is already in use"
- You can change the port by setting `PORT=3001` in your `.env` file.

#### 4. "How do I test without a real Gmail account?"
- Simply leave `GMAIL_USER` and `GMAIL_APP_PASSWORD` blank. The app will automatically spin up an **Ethereal Mailbox** and print instant web preview URLs in the console for each email dispatched.

---

##  License

This project is licensed under the [MIT License](LICENSE).
