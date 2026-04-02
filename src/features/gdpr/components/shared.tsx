const STATUS_STYLES: Record<string, string> = {
  received: 'border-sky-200 bg-sky-50 text-sky-700',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
  export_ready: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  fulfilled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  approved: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  expired: 'border-rose-200 bg-rose-50 text-rose-700',
  approved_for_deletion: 'border-violet-200 bg-violet-50 text-violet-700',
  deleted: 'border-slate-200 bg-slate-100 text-slate-700',
  retained: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-slate-200 bg-slate-100 text-slate-700',
  generating: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StatusPill({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_150)] bg-[oklch(0.985_0.005_150)] p-6 text-center">
      <h3 className="text-sm font-semibold text-[oklch(0.2_0.03_160)]">{title}</h3>
      <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">{description}</p>
    </div>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[oklch(0.88_0.005_150)] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[oklch(0.55_0.08_160)] focus:ring-2 focus:ring-[oklch(0.85_0.03_160)] ${className}`}
    />
  );
}

export function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-[oklch(0.88_0.005_150)] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[oklch(0.55_0.08_160)] focus:ring-2 focus:ring-[oklch(0.85_0.03_160)] ${className}`}
    />
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-[oklch(0.88_0.005_150)] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[oklch(0.55_0.08_160)] focus:ring-2 focus:ring-[oklch(0.85_0.03_160)] ${className}`}
    />
  );
}

export function ActionButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const base = 'rounded-lg px-3 py-2 text-sm font-medium transition-colors';
  const variantClass =
    variant === 'primary'
      ? 'bg-[oklch(0.3_0.08_160)] text-white hover:bg-[oklch(0.26_0.08_160)]'
      : variant === 'danger'
        ? 'bg-rose-600 text-white hover:bg-rose-700'
        : 'border border-[oklch(0.88_0.005_150)] bg-white text-[oklch(0.28_0.03_160)] hover:bg-[oklch(0.97_0.003_160)]';

  return (
    <button {...props} className={`${base} ${variantClass} ${className}`}>
      {children}
    </button>
  );
}
