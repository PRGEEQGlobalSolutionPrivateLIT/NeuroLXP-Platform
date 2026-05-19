'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeumorphicButton } from './NeumorphicButton';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onScrollBottom?: () => void;
}

export function Modal({ open, onClose, title, children, onScrollBottom }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !onScrollBottom || !open) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
        onScrollBottom();
      }
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [onScrollBottom, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a354f]/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="neo-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--neo-shadow-dark)]/15 px-6 py-4">
              <h3 className="text-lg font-bold text-[var(--neo-text)]">{title}</h3>
              <NeumorphicButton className="!min-w-0 px-3 py-2" onClick={onClose}>
                ✕
              </NeumorphicButton>
            </div>
            <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-[var(--neo-muted)]">
              {children}
            </div>
            {onScrollBottom && (
              <p className="border-t border-[var(--neo-shadow-dark)]/10 px-6 py-3 text-center text-xs text-[var(--neo-muted)]">
                Scroll to the bottom to accept
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
