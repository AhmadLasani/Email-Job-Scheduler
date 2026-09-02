# Email Job Scheduler

A complete full-stack scheduled email dispatch platform built with Node.js, Express, Nodemailer, React 19, and Tailwind CSS. Features an autonomous background worker daemon that runs continuously to deliver queued emails at their scheduled time.

---

## 🚀 How to Deploy on Render

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Push this project to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Email Job Scheduler"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/email-job-scheduler.git
   git push -u origin main
   ```

---

### Step 2: Deploy to Render as a Web Service
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `email-job-scheduler`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

---

### Step 3: Add Gmail / SMTP Environment Variables on Render
Under the **Environment Variables** tab in your Render service, add:

| Key | Example Value | Description |
|---|---|---|
| `GMAIL_USER` | `manalitrip5454@gmail.com` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | `abcd efgh ijkl mnop` | 16-character Google App Password |
| `NODE_ENV` | `production` | Production environment |

> 🔑 **How to get a Google App Password (in 30 seconds):**
> 1. Go to your [Google Account Security](https://myaccount.google.com/security).
> 2. Ensure **2-Step Verification** is turned ON.
> 3. Search for **App passwords** or go to `https://myaccount.google.com/apppasswords`.
> 4. Enter a name (e.g. `Email Scheduler`) and click **Create**.
> 5. Copy the generated 16-letter password and paste it into `GMAIL_APP_PASSWORD`.

---

## ⚙️ How It Works in Real-Time

1. **Scheduling**: When you compose an email and choose a future date/time, the job is saved to the database with status `scheduled`.
2. **Background Daemon**: The server runs an internal cron daemon loop every 3 seconds that queries for pending emails where `scheduledFor <= current_time`.
3. **Live Sending**:
   - The daemon connects to Gmail's SMTP servers and dispatches the email directly to the recipient's real mailbox.
   - Upon success, the status transitions to `Sent` with the exact delivery timestamp (`sentAt`).
4. **Failure Handling**:
   - If the recipient address is invalid, the inbox doesn't exist, or credentials fail, the daemon marks the status as `Failed` and records the exact error message (e.g., `550 Invalid recipient address`).
   - You can inspect the failure reason in your dashboard and retry anytime.
5. **Zero-Config Test Mode**: If no Gmail credentials are provided, the app automatically provisions an Ethereal test mailbox with instant web inspection links.

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start local server (Express + Vite)
npm run dev

# Production Build
npm run build
npm start
```
The server will run at `http://localhost:3000`.
