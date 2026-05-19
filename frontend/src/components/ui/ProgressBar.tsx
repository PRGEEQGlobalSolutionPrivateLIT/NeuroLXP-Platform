'use client';

import clsx from 'clsx';

export function ProgressBar({
  current,
  total,
  mode = 'signup',
}: {
  current: number;
  total: number;
  mode?: 'signup' | 'signin';
}) {
  if (mode === 'signin') return null;

  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="neo-step-progress mb-8 w-full">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">
          Registration progress
        </span>
        <span className="text-xs font-semibold text-[var(--neo-muted)]">
          Step <span className="text-[var(--neo-primary)]">{current}</span> of {total}
        </span>
      </div>

      <div className="neo-step-track" role="list" aria-label={`Registration step ${current} of ${total}`}>
        {steps.map((stepNum, index) => {
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          const isPending = stepNum > current;

          return (
            <div key={stepNum} className="neo-step-item" role="listitem">
              {index > 0 && (
                <span
                  className={clsx(
                    'neo-step-connector',
                    stepNum - 1 < current && 'neo-step-connector--done',
                    stepNum - 1 === current && 'neo-step-connector--current',
                  )}
                  aria-hidden
                />
              )}
              <span
                className={clsx(
                  'neo-step-dot',
                  isCompleted && 'neo-step-dot--completed',
                  isCurrent && 'neo-step-dot--current',
                  isPending && 'neo-step-dot--pending',
                )}
                title={`Step ${stepNum}${isCurrent ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {stepNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
