'use client';

import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { AlertCircle, Info, X, ThumbsUp } from 'lucide-react';
import clsx from 'clsx';

export function NeoToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{
        top: 16,
        left: 16,
        right: 16,
        width: 'auto',
        maxWidth: 'none',
      }}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: '0 auto',
          maxWidth: '100%',
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ message }) => (
            <div
              className={clsx(
                'neo-toast-banner',
                t.type === 'success' && 'neo-toast-banner--success',
                t.type === 'error' && 'neo-toast-banner--error',
                (t.type === 'blank' || !t.type || t.type === 'custom') && 'neo-toast-banner--info',
                !t.visible && 'neo-toast-banner--exit',
              )}
              role="alert"
            >
              <span className="neo-toast-banner-icon" aria-hidden>
                {t.type === 'success' ? (
                  <ThumbsUp className="h-5 w-5" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Info className="h-5 w-5" />
                )}
              </span>
              <div className="neo-toast-banner-body">
                {t.type === 'success' && <strong className="neo-toast-banner-title">Well done!</strong>}
                {t.type === 'error' && <strong className="neo-toast-banner-title">Attention</strong>}
                <p className="neo-toast-banner-message">{message}</p>
              </div>
              <button
                type="button"
                className="neo-toast-banner-close"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
