export const api = {
  async getAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch auth');
    return res.json();
  },

  async login(userData) {
    const payload = typeof userData === 'string' 
      ? { name: arguments[0], email: arguments[1], avatar: arguments[2] } 
      : userData;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to log in');
    return res.json();
  },

  async updateCredentials(credentials) {
    const res = await fetch('/api/auth/update-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update credentials');
    return data;
  },

  async testSmtp(credentials) {
    const res = await fetch('/api/auth/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SMTP Verification failed');
    return data;
  },

  async logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to log out');
    return res.json();
  },

  async toggleGmail() {
    const res = await fetch('/api/auth/toggle-gmail', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle Gmail');
    return res.json();
  },

  async getEmails(userId) {
    const url = userId ? `/api/emails?userId=${encodeURIComponent(userId)}` : '/api/emails';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
  },

  async getStats(userId) {
    const url = userId ? `/api/stats?userId=${encodeURIComponent(userId)}` : '/api/stats';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getRecentRecipients(userId) {
    const url = userId ? `/api/recipients/recent?userId=${encodeURIComponent(userId)}` : '/api/recipients/recent';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recent recipients');
    return res.json();
  },

  async scheduleEmail(payload) {
    const res = await fetch('/api/emails/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to schedule email');
    return data;
  },

  async sendNow(payload) {
    const res = await fetch('/api/emails/send-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send email');
    return data;
  },

  async recordEmail(payload) {
    const res = await fetch('/api/emails/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record email');
    return data;
  },

  async cancelEmail(id) {
    const res = await fetch(`/api/emails/${id}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel email');
    return data;
  },

  async retryEmail(id) {
    const res = await fetch(`/api/emails/${id}/retry`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retry email');
    return data;
  },

  async deleteEmail(id) {
    const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete email');
    return data;
  },

  async getSystemInfo() {
    const res = await fetch('/api/system/info');
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },
};
