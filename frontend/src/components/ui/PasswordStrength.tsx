'use client';

const RULES = [
  { key: 'len', label: 'Minimum 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'At least 1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'At least 1 lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'special', label: 'At least 1 special character', test: (p: string) => /[@$!%*?&#]/.test(p) },
  { key: 'num', label: 'At least 1 number', test: (p: string) => /\d/.test(p) },
];

function strength(password: string): { label: string; color: string; pct: number } {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (passed <= 2) return { label: 'Weak', color: '#ef4444', pct: 33 };
  if (passed <= 4) return { label: 'Medium', color: '#f59e0b', pct: 66 };
  return { label: 'Strong', color: '#22c55e', pct: 100 };
}

function StrengthBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{ width: `${pct}%`, backgroundColor: color }}
    />
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const s = strength(password);
  const allPass = RULES.every((r) => r.test(password));

  return (
    <div className="mt-3 space-y-3">
      <ul className="space-y-1 text-sm">
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.key} className={ok ? 'text-green-600' : 'text-red-500'}>
              {ok ? '✓' : '✗'} {r.label}
            </li>
          );
        })}
      </ul>
      <div>
        <p className="text-xs font-medium text-[var(--neo-muted)]">Strength: {s.label}</p>
        <div className="neo-inset mt-1 h-2 overflow-hidden rounded-full">
          <StrengthBar pct={s.pct} color={s.color} />
        </div>
      </div>
      {allPass && <p className="text-xs text-green-600">All password rules satisfied</p>}
    </div>
  );
}

export function isPasswordValid(password: string) {
  return RULES.every((r) => r.test(password));
}