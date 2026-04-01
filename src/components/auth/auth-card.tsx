/**
 * AuthCard — shared card container for all auth pages.
 * Provides consistent styling, spacing, and structure.
 */
export function AuthCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_4px_24px_-4px_oklch(0.3_0.04_160/0.12),0_1px_4px_-1px_oklch(0.3_0.04_160/0.08)]">
      <div className="px-8 pt-8 pb-6">
        <div className="mb-6 text-center">
          <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-[oklch(0.48_0_0)]">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
