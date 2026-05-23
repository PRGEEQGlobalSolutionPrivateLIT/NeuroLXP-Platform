import Image from 'next/image';
import clsx from 'clsx';

interface Props {
  size?: 'sm' | 'md' | 'sidebar';
  /** Text beside logo — off by default; logo image includes the name */
  showWordmark?: boolean;
  className?: string;
}

/** Width × height — logo is taller (icon + wordmark in one image) */
const IMG_SIZE = {
  sm: { width: 48, height: 56 },
  md: { width: 56, height: 64 },
  sidebar: { width: 132, height: 152 },
} as const;

const WORDMARK = {
  sm: 'text-sm',
  md: 'text-sm',
  sidebar: 'text-base',
} as const;

export function NeuroLXPLogo({ size = 'md', showWordmark = false, className }: Props) {
  const { width, height } = IMG_SIZE[size];

  return (
    <div
      className={clsx(
        'flex items-center',
        showWordmark ? 'gap-3' : 'w-full justify-center',
        className,
      )}
    >
      <Image
        src="/neurolxp-logo.png"
        alt="NeuroLXP"
        width={width}
        height={height}
        className={clsx('h-auto max-w-full object-contain', size === 'sidebar' && 'w-[132px]')}
        priority
      />
      {showWordmark && (
        <div className="leading-tight">
          <span className={clsx('block font-bold text-[var(--neo-text)]', WORDMARK[size])}>neuro</span>
          <span className={clsx('block font-bold text-[var(--neo-primary)]', WORDMARK[size])}>LXP</span>
        </div>
      )}
    </div>
  );
}
