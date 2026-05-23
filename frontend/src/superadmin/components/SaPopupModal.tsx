'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

/** Centered popup overlay (not dropdown) */
export function SaPopupModal({ open, onClose, title, children, maxWidth = 'max-w-md' }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--neo-text)]/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={clsx('neo-card flex max-h-[85vh] w-full flex-col overflow-hidden shadow-2xl', maxWidth)}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--neo-shadow-dark)]/15 px-5 py-4">
              <h3 className="text-lg font-bold text-[var(--neo-text)]">{title}</h3>
              <NeumorphicButton className="!min-w-0 px-3 py-2" onClick={onClose}>
                ✕
              </NeumorphicButton>
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
