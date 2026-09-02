import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCheck, Copy, ExternalLink } from 'lucide-react';

export const EmailDetailModal = ({
  email,
  onClose,
  onCancelEmail,
  onDuplicateEmail,
}) => {
  if (!email) return null;

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString([], {
        dateStyle: 'full',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="font-normal text-base text-neutral-900 truncate max-w-xs">
                {email.subject || '(No Subject)'}
              </h3>
              {email.status === 'scheduled' && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800">
                  Scheduled
                </span>
              )}
              {email.status === 'sent' && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Delivered</span>
                </span>
              )}
              {email.status === 'failed' && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                  Failed
                </span>
              )}
              {email.status === 'cancelled' && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  Cancelled
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            {/* Metadata Grid */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">To:</span>
                <span className="font-normal text-neutral-900">{email.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">From:</span>
                <span className="text-neutral-800 font-normal">{email.senderEmail || 'manalitrip5454@gmail.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {email.status === 'sent' ? 'Delivered at:' : 'Scheduled for:'}
                </span>
                <span className="font-normal text-neutral-900">
                  {formatDate(email.sentAt || email.scheduledFor)}
                </span>
              </div>
              {email.previewUrl && (
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200/70">
                  <span className="text-neutral-500">Test Mailbox:</span>
                  <a
                    href={email.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>Open Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div>
              <p className="text-xs font-normal uppercase tracking-wider text-neutral-400 mb-1.5">
                Message Content
              </p>
              <div className="bg-neutral-50/50 border border-neutral-200 rounded-xl p-4 whitespace-pre-wrap leading-relaxed text-neutral-800 font-sans text-xs sm:text-sm font-normal">
                {email.body || '(No message content)'}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onDuplicateEmail(email);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Draft</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {email.status === 'scheduled' && (
                <button
                  onClick={() => {
                    onCancelEmail(email.id);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-normal text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Cancel Schedule
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
