import React from 'react';
import { motion } from 'motion/react';
import { CalendarClock, Send, AlertCircle, Clock, Plus } from 'lucide-react';

export const DashboardView = ({
  user,
  stats,
  emails,
  onComposeClick,
  onViewEmail,
  onCancelEmail,
  onViewAllScheduled,
}) => {
  const scheduledEmails = emails.filter((e) => e.status === 'scheduled');
  const upcomingEmails = scheduledEmails.slice(0, 6);

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatScheduledTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const isTomorrow =
        date.getDate() === now.getDate() + 1 &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      if (isToday) {
        return `Today · ${timeStr}`;
      }
      if (isTomorrow) {
        return `Tomorrow · ${timeStr}`;
      }

      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      return `${dayName} · ${timeStr}`;
    } catch {
      return 'Upcoming';
    }
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Ahmad';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner: Greeting + Compose Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 font-normal mt-1">
            What would you like to send today?
          </p>
        </div>

        <button
          id="button-compose-main"
          onClick={onComposeClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-normal text-sm hover:bg-black transition-all shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* 3 Metric Cards matching Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Scheduled Metric */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-normal text-neutral-600">Scheduled</span>
            <CalendarClock className="w-5 h-5 text-neutral-500 stroke-[1.6]" />
          </div>
          <p className="text-3xl font-normal text-neutral-950 mt-3 tracking-tight">
            {stats.scheduled}
          </p>
        </div>

        {/* Sent Metric */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-normal text-neutral-600">Sent</span>
            <Send className="w-5 h-5 text-neutral-500 stroke-[1.6]" />
          </div>
          <p className="text-3xl font-normal text-neutral-950 mt-3 tracking-tight">
            {stats.sent}
          </p>
        </div>

        {/* Failed Metric */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-normal text-neutral-600">Failed</span>
            <AlertCircle className="w-5 h-5 text-neutral-400 stroke-[1.6]" />
          </div>
          <p className="text-3xl font-normal text-neutral-950 mt-3 tracking-tight">
            {stats.failed}
          </p>
        </div>
      </div>

      {/* Upcoming Emails Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-neutral-900">
            Upcoming Emails
          </h2>
          {scheduledEmails.length > 0 && (
            <button
              onClick={onViewAllScheduled}
              className="text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer font-normal"
            >
              View all ({scheduledEmails.length})
            </button>
          )}
        </div>

        {upcomingEmails.length === 0 ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-10 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mx-auto mb-3">
              <Clock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-normal text-neutral-900 mb-1">
              No emails scheduled yet
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mb-5 font-normal">
              Your future emails will appear here when you schedule them. They will be processed automatically at the scheduled time.
            </p>
            <button
              onClick={onComposeClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs sm:text-sm font-normal hover:bg-black transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule your first email</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {upcomingEmails.map((email) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-neutral-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-medium text-neutral-900 truncate">
                      {email.subject}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                      Scheduled
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5 flex-wrap font-normal">
                    <span>
                      To: <span className="text-neutral-800">{email.to}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-neutral-600">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 stroke-[1.8]" />
                      {formatScheduledTime(email.scheduledFor)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                  <button
                    onClick={() => onViewEmail(email)}
                    className="text-sm font-normal text-neutral-700 hover:text-neutral-950 px-2 py-1 transition-colors cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onCancelEmail(email.id)}
                    className="text-sm font-normal text-neutral-700 hover:text-red-600 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
