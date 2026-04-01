import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[oklch(0.985_0.005_150)]">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.2 0 0) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      {/* Soft gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'oklch(0.72 0.1 160)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'oklch(0.65 0.08 230)' }}
        aria-hidden="true"
      />

      {/* Header with logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group"
          aria-label="Complete Care home"
        >
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.22_0.04_160)] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-[oklch(0.18_0.03_160)] font-semibold text-lg tracking-tight">
            Complete Care
          </span>
        </Link>
      </div>

      {/* Page content (auth card) */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-[oklch(0.5_0_0)]">
        © {new Date().getFullYear()} Complete Care. UK Care Management Platform.
      </p>
    </div>
  );
}
