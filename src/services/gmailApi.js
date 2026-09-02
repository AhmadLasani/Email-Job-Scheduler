import { getCachedAccessToken } from '../firebase/config';

/**
 * Creates an RFC 2822 formatted email message string and encodes it into base64url format
 */
function createRawEmailMessage({ to, subject, body, fromName, fromEmail }) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const senderHeader = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

  const emailLines = [
    `From: ${senderHeader}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">${escapeHtml(subject)}</h2>
      <div style="white-space: pre-wrap; font-size: 14px; margin-top: 12px;">${escapeHtml(body)}</div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
      <p style="font-size: 11px; color: #9ca3af; margin-top: 8px;">Sent via Automated Email Job Scheduler • From ${escapeHtml(fromEmail)}</p>
    </div>`,
  ];

  const emailString = emailLines.join('\r\n');

  // Convert to base64url format (RFC 4648)
  const encodedEmail = btoa(unescape(encodeURIComponent(emailString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedEmail;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends an email directly via the official Google Gmail REST API using the user's OAuth access token.
 * This guarantees real delivery from the authenticated Google account straight to the recipient inbox.
 */
export async function sendEmailViaGmailApi({
  to,
  subject,
  body,
  fromName,
  fromEmail,
  accessToken: explicitToken,
}) {
  const token = explicitToken || getCachedAccessToken();

  if (!token) {
    throw new Error(
      'No Google OAuth access token found. Please sign in with Google or reconnect your Google account.'
    );
  }

  const rawMessage = createRawEmailMessage({
    to,
    subject,
    body,
    fromName,
    fromEmail,
  });

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gmail API error (${response.status})`;
    throw new Error(message);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    threadId: result.threadId,
    labels: result.labelIds,
  };
}
