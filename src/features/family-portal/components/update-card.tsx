'use client';

import { cn } from '@/lib/utils';

interface UpdateCardProps {
  title: string;
  content: string;
  updateType: string;
  createdByName: string;
  publishedAt: Date | string | null;
  mediaUrls?: string[];
  className?: string;
}

/**
 * Card displaying a shared update/photo from the care team.
 */
export function UpdateCard({
  title,
  content,
  updateType,
  createdByName,
  publishedAt,
  mediaUrls = [],
  className,
}: UpdateCardProps) {
  const typeLabels: Record<string, string> = {
    general: 'Update',
    photo: 'Photo',
    milestone: 'Milestone',
    activity: 'Activity',
  };

  return (
    <article className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {typeLabels[updateType] ?? updateType}
        </span>
        {publishedAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(publishedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{content}</p>

      {mediaUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {mediaUrls.map((url, i) => (
            <div
              key={i}
              className="aspect-square rounded bg-muted"
              aria-label={`Shared photo ${i + 1}`}
            >
              {/* In production, this would render an <Image /> component */}
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Photo
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Shared by {createdByName}
      </p>
    </article>
  );
}
