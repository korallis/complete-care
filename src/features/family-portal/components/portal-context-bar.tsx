import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { FamilyPortalLinkedPerson } from '../server';

interface PortalContextBarProps {
  linkedPersons: FamilyPortalLinkedPerson[];
  currentPersonId: string;
  currentPath: '/portal' | '/portal/messages' | '/portal/updates' | '/portal/care-info';
}

const PORTAL_TABS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/messages', label: 'Messages' },
  { href: '/portal/updates', label: 'Updates' },
  { href: '/portal/care-info', label: 'Care information' },
] as const;

export function PortalContextBar({
  linkedPersons,
  currentPersonId,
  currentPath,
}: PortalContextBarProps) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2" aria-label="Family portal sections">
        {PORTAL_TABS.map((tab) => {
          const active = tab.href === currentPath;

          return (
            <Link
              key={tab.href}
              href={`${tab.href}?personId=${currentPersonId}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-white text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {linkedPersons.length > 1 && (
        <div className="flex flex-wrap gap-2" aria-label="Linked family members">
          {linkedPersons.map((person) => {
            const active = person.personId === currentPersonId;

            return (
              <Link
                key={`${person.organisationId}:${person.personId}`}
                href={`${currentPath}?personId=${person.personId}`}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'bg-white text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="font-medium">{person.personName}</div>
                <div className="text-xs text-muted-foreground">
                  {person.relationship} · {person.domainLabel}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
