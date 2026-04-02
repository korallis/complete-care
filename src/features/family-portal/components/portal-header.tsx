'use client';

import { cn } from '@/lib/utils';

interface PortalHeaderProps {
  personName: string;
  relationship: string;
  domainLabel: string;
  className?: string;
}

/**
 * Family portal header showing the person's name, relationship, and care domain.
 */
export function PortalHeader({
  personName,
  relationship,
  domainLabel,
  className,
}: PortalHeaderProps) {
  return (
    <header className={cn('border-b bg-card px-6 py-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {personName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {relationship} &middot; {domainLabel}
          </p>
        </div>
      </div>
    </header>
  );
}
