/**
 * PersonTypeBadge — displays the person's type with domain-appropriate color.
 */
type PersonTypeBadgeProps = {
  type: string;
};

const typeConfig: Record<string, { label: string; classes: string }> = {
  resident: {
    label: 'Resident',
    classes: 'bg-[oklch(0.35_0.06_160)/0.1] text-[oklch(0.25_0.08_160)] border-[oklch(0.35_0.06_160)/0.25]',
  },
  client: {
    label: 'Client',
    classes: 'bg-[oklch(0.35_0.09_220)/0.1] text-[oklch(0.25_0.09_220)] border-[oklch(0.35_0.09_220)/0.25]',
  },
  young_person: {
    label: 'Young Person',
    classes: 'bg-[oklch(0.55_0.12_85)/0.1] text-[oklch(0.42_0.12_85)] border-[oklch(0.55_0.12_85)/0.25]',
  },
};

export function PersonTypeBadge({ type }: PersonTypeBadgeProps) {
  const config = typeConfig[type] ?? {
    label: type,
    classes: 'bg-[oklch(0.91_0.005_160)] text-[oklch(0.55_0_0)] border-[oklch(0.85_0.01_160)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

/**
 * PersonStatusBadge — displays the person's lifecycle status.
 */
type PersonStatusBadgeProps = {
  status: string;
};

export function PersonStatusBadge({ status }: PersonStatusBadgeProps) {
  const isArchived = status === 'archived';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isArchived
          ? 'bg-[oklch(0.91_0.005_160)] text-[oklch(0.55_0_0)]'
          : 'bg-[oklch(0.35_0.06_160)/0.1] text-[oklch(0.25_0.08_160)]'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isArchived ? 'bg-[oklch(0.7_0_0)]' : 'bg-[oklch(0.45_0.12_160)]'
        }`}
        aria-hidden="true"
      />
      {isArchived ? 'Archived' : 'Active'}
    </span>
  );
}
