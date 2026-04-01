'use client';

/**
 * BackButton — client component that calls window.history.back().
 * Used in error/permission pages as a "Go Back" action.
 */

type BackButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function BackButton({ className, children }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={className}
    >
      {children}
    </button>
  );
}
