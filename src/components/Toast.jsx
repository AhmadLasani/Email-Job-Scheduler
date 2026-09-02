import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`pointer-events-auto p-3 rounded-lg border shadow-md flex items-center justify-between gap-3 text-xs font-normal ${
              t.type === 'success'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : t.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-white text-[#1A1A1A] border-[#E5E5E5]'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#737373] shrink-0" />}
              <span>{t.text}</span>
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
