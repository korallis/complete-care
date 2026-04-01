/**
 * PersonAvatar — displays person photo or initials fallback.
 */
import { getInitials } from '@/features/persons/utils';

type PersonAvatarProps = {
  fullName: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasAllergies?: boolean;
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function PersonAvatar({
  fullName,
  photoUrl,
  size = 'md',
  hasAllergies = false,
}: PersonAvatarProps) {
  const initials = getInitials(fullName);

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-semibold bg-[oklch(0.22_0.04_160)/0.12] text-[oklch(0.22_0.04_160)] border-2 border-white shadow-sm flex-shrink-0`}
        aria-hidden="true"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`Photo of ${fullName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {hasAllergies && (
        <span
          className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white"
          aria-label="Has allergies"
          title="Has recorded allergies"
        />
      )}
    </div>
  );
}
