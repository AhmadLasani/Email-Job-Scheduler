import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RotateCw, Mail } from 'lucide-react';

export const FailedView = ({
  emails,
  onRetry,
  onReconnectGmail,
}) => {
  const failedEmails = emails.filter((e) => e.status === 'failed');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Failed Emails
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Emails that couldn't be sent.
        </p>
      </div>

      {failedEmails.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            No failed emails
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            All your scheduled emails have been delivered without issues.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>If your authorization expired, reconnect your account to continue sending.</span>
            </div>
            <button
              onClick={onReconnectGmail}
              className="px-3 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Reconnect Gmail
            </button>
          </div>

          {failedEmails.map((email) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-red-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-semibold text-neutral-900 text-sm sm:text-base">
                    {email.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                    Failed
                  </span>
                </div>

                <div className="text-xs text-neutral-600 mb-1">
                  To: <strong className="font-medium text-neutral-800">{email.to}</strong>
                </div>

                <div className="text-xs text-red-600">
                  Couldn't send this email: {email.failedReason || 'Delivery temporary timeout'}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onRetry(email.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
