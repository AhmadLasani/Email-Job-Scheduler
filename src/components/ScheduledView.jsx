import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Plus, Search } from 'lucide-react';

export const ScheduledView = ({
  emails,
  onComposeClick,
  onViewEmail,
  onCancelEmail,
  onDuplicateEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const scheduledEmails = emails
    .filter((e) => e.status === 'scheduled')
    .filter(
      (e) =>
        e.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

      const dayName = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      return `${dayName} · ${timeStr}`;
    } catch {
      return 'Upcoming';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight">
            Scheduled Emails
          </h1>
          <p className="text-sm text-neutral-500 font-normal mt-1">
            Emails queued in the server daemon for automated delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheduled..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-neutral-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors w-48 sm:w-64 font-normal"
            />
          </div>

          <button
            onClick={onComposeClick}
            className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-normal hover:bg-black transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New</span>
          </button>
        </div>
      </div>

      {/* List of Scheduled Emails */}
      {scheduledEmails.length === 0 ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mx-auto mb-3">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-normal text-neutral-900 mb-1">
            {searchQuery ? 'No matching scheduled emails' : 'No emails currently scheduled'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mb-5 font-normal">
            {searchQuery
              ? 'Try changing your search terms.'
              : 'Write your message and set a future date. It will dispatch automatically.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onComposeClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs sm:text-sm font-normal hover:bg-black transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule an email</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {scheduledEmails.map((email) => (
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
                  onClick={() => onDuplicateEmail(email)}
                  className="text-sm font-normal text-neutral-700 hover:text-neutral-950 px-2 py-1 transition-colors cursor-pointer"
                >
                  Duplicate
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
  );
};
