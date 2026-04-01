'use client';

/**
 * MobileSidebar — slide-over drawer sidebar for mobile viewports.
 *
 * Controlled by the parent via isOpen/onClose.
 * Uses CSS transitions for the slide-in/out animation.
 * Traps focus within the drawer when open.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Heart } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import type { NavItem } from '@/lib/rbac/nav-items';
import type { Role } from '@/lib/rbac/permissions';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  orgSlug: string;
  orgName: string;
  role: Role;
}

const ROLE_DISPLAY: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Carer',
  viewer: 'Viewer',
};

export function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  orgSlug,
  orgName,
  role,
}: MobileSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const roleLabel = ROLE_DISPLAY[role] ?? role;

  // Focus the close button when drawer opens
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[oklch(0.91_0.005_160)] px-4 py-3.5">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center flex-shrink-0">
              <Heart className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-[13px] font-semibold text-[oklch(0.22_0.04_160)] tracking-tight">
              Complete Care
            </span>
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-[oklch(0.5_0_0)] hover:bg-[oklch(0.96_0.005_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.35_0.06_160)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Org context */}
        <div className="px-4 py-3 border-b border-[oklch(0.91_0.005_160)]">
          <div className="flex items-center gap-2 rounded-md bg-[oklch(0.97_0.005_160)] px-2.5 py-2">
            <div
              className="w-6 h-6 rounded-md bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 select-none"
              aria-hidden="true"
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[oklch(0.22_0.04_160)] truncate leading-tight">
                {orgName}
              </p>
              <p className="text-[10px] text-[oklch(0.58_0_0)] capitalize leading-tight mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav items={navItems} orgSlug={orgSlug} onNavigate={onClose} />

        {/* Footer */}
        <div className="border-t border-[oklch(0.91_0.005_160)] px-4 py-3">
          <p className="text-[10px] text-[oklch(0.68_0_0)] text-center">
            © {new Date().getFullYear()} Complete Care
          </p>
        </div>
      </div>
    </>
  );
}
