/**
 * PasswordStrengthIndicator — visual password strength meter.
 * Shows 4 criteria: length, uppercase, number, special char.
 */
'use client';

type Criterion = {
  label: string;
  met: boolean;
};

function getCriteria(password: string): Criterion[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrengthLevel(criteria: Criterion[]): {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  const met = criteria.filter((c) => c.met).length;
  if (met === 0) return { level: 0, label: '', color: 'bg-border' };
  if (met === 1) return { level: 1, label: 'Weak', color: 'bg-destructive' };
  if (met === 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
  if (met === 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
  return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const criteria = getCriteria(password);
  const strength = getStrengthLevel(criteria);

  return (
    <div className="mt-2 space-y-2" aria-live="polite" aria-label="Password strength">
      {/* Strength bars */}
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              bar <= strength.level ? strength.color : 'bg-border'
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-xs text-muted-foreground">
          Strength:{' '}
          <span
            className={
              strength.level === 4
                ? 'text-emerald-600 font-medium'
                : strength.level === 3
                  ? 'text-blue-600 font-medium'
                  : strength.level === 2
                    ? 'text-amber-600 font-medium'
                    : 'text-destructive font-medium'
            }
          >
            {strength.label}
          </span>
        </p>
      )}

      {/* Criteria checklist */}
      <ul className="space-y-1">
        {criteria.map((criterion) => (
          <li
            key={criterion.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              criterion.met ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            <span aria-hidden="true">{criterion.met ? '✓' : '○'}</span>
            <span>{criterion.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
