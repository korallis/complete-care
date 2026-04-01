'use client';

/**
 * BodyMapSVG — Interactive front/back human outline SVG.
 *
 * Renders a clean human outline with:
 * - Click events that capture x/y coordinates as percentages
 * - Existing marks shown as colored dots
 * - Front/back toggle
 */

import type { BodyMapEntryListItem } from '@/features/documents/actions';
import { ENTRY_TYPE_COLOURS, type EntryType } from '@/features/documents/constants';

type BodyMapSVGProps = {
  side: 'front' | 'back';
  entries: BodyMapEntryListItem[];
  onClick?: (xPercent: number, yPercent: number) => void;
  selectedEntryId?: string | null;
  interactive?: boolean;
};

/**
 * Front-facing human outline path.
 * Simple, recognizable silhouette.
 */
function FrontOutline() {
  return (
    <g fill="none" stroke="oklch(0.45 0.02 160)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Head */}
      <ellipse cx="150" cy="38" rx="22" ry="26" />
      {/* Neck */}
      <line x1="143" y1="64" x2="143" y2="78" />
      <line x1="157" y1="64" x2="157" y2="78" />
      {/* Shoulders */}
      <path d="M143 78 Q130 78 115 85 Q95 95 85 105" />
      <path d="M157 78 Q170 78 185 85 Q205 95 215 105" />
      {/* Left arm */}
      <path d="M85 105 Q75 130 70 155 Q65 175 60 195" />
      <path d="M95 108 Q87 130 82 155 Q77 175 72 195" />
      {/* Left hand */}
      <path d="M60 195 Q55 205 52 215 Q50 220 55 222 Q60 218 65 212" />
      <path d="M72 195 Q68 205 65 212" />
      {/* Right arm */}
      <path d="M215 105 Q225 130 230 155 Q235 175 240 195" />
      <path d="M205 108 Q213 130 218 155 Q223 175 228 195" />
      {/* Right hand */}
      <path d="M240 195 Q245 205 248 215 Q250 220 245 222 Q240 218 235 212" />
      <path d="M228 195 Q232 205 235 212" />
      {/* Torso left side */}
      <path d="M95 108 Q92 140 92 170 Q92 190 95 210 Q98 230 105 250" />
      {/* Torso right side */}
      <path d="M205 108 Q208 140 208 170 Q208 190 205 210 Q202 230 195 250" />
      {/* Waist */}
      <path d="M105 250 Q115 255 130 258 Q150 260 170 258 Q185 255 195 250" />
      {/* Left leg */}
      <path d="M105 250 Q102 280 100 310 Q98 340 97 370 Q96 395 95 420" />
      <path d="M130 258 Q128 280 126 310 Q124 340 123 370 Q122 395 120 420" />
      {/* Left foot */}
      <path d="M95 420 Q90 430 85 435 Q82 438 88 440 Q95 438 100 435" />
      <path d="M120 420 Q115 430 100 435" />
      {/* Right leg */}
      <path d="M195 250 Q198 280 200 310 Q202 340 203 370 Q204 395 205 420" />
      <path d="M170 258 Q172 280 174 310 Q176 340 177 370 Q178 395 180 420" />
      {/* Right foot */}
      <path d="M205 420 Q210 430 215 435 Q218 438 212 440 Q205 438 200 435" />
      <path d="M180 420 Q185 430 200 435" />
    </g>
  );
}

/**
 * Back-facing human outline path.
 */
function BackOutline() {
  return (
    <g fill="none" stroke="oklch(0.45 0.02 160)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Head */}
      <ellipse cx="150" cy="38" rx="22" ry="26" />
      {/* Neck */}
      <line x1="143" y1="64" x2="143" y2="78" />
      <line x1="157" y1="64" x2="157" y2="78" />
      {/* Shoulders */}
      <path d="M143 78 Q130 78 115 85 Q95 95 85 105" />
      <path d="M157 78 Q170 78 185 85 Q205 95 215 105" />
      {/* Spine indication */}
      <line x1="150" y1="82" x2="150" y2="240" strokeDasharray="4 4" strokeWidth="1" opacity="0.4" />
      {/* Left arm */}
      <path d="M85 105 Q75 130 70 155 Q65 175 60 195" />
      <path d="M95 108 Q87 130 82 155 Q77 175 72 195" />
      {/* Left hand */}
      <path d="M60 195 Q55 205 52 215 Q50 220 55 222 Q60 218 65 212" />
      <path d="M72 195 Q68 205 65 212" />
      {/* Right arm */}
      <path d="M215 105 Q225 130 230 155 Q235 175 240 195" />
      <path d="M205 108 Q213 130 218 155 Q223 175 228 195" />
      {/* Right hand */}
      <path d="M240 195 Q245 205 248 215 Q250 220 245 222 Q240 218 235 212" />
      <path d="M228 195 Q232 205 235 212" />
      {/* Back left side */}
      <path d="M95 108 Q92 140 92 170 Q92 190 95 210 Q98 230 105 250" />
      {/* Back right side */}
      <path d="M205 108 Q208 140 208 170 Q208 190 205 210 Q202 230 195 250" />
      {/* Hip line */}
      <path d="M105 250 Q115 255 130 258 Q150 260 170 258 Q185 255 195 250" />
      {/* Shoulder blades */}
      <ellipse cx="125" cy="120" rx="15" ry="20" strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="175" cy="120" rx="15" ry="20" strokeWidth="0.8" opacity="0.3" />
      {/* Left leg */}
      <path d="M105 250 Q102 280 100 310 Q98 340 97 370 Q96 395 95 420" />
      <path d="M130 258 Q128 280 126 310 Q124 340 123 370 Q122 395 120 420" />
      {/* Left foot */}
      <path d="M95 420 Q90 430 85 435 Q82 438 88 440 Q95 438 100 435" />
      <path d="M120 420 Q115 430 100 435" />
      {/* Right leg */}
      <path d="M195 250 Q198 280 200 310 Q202 340 203 370 Q204 395 205 420" />
      <path d="M170 258 Q172 280 174 310 Q176 340 177 370 Q178 395 180 420" />
      {/* Right foot */}
      <path d="M205 420 Q210 430 215 435 Q218 438 212 440 Q205 438 200 435" />
      <path d="M180 420 Q185 430 200 435" />
    </g>
  );
}

export function BodyMapSVG({
  side,
  entries,
  onClick,
  selectedEntryId,
  interactive = true,
}: BodyMapSVGProps) {
  const viewBoxWidth = 300;
  const viewBoxHeight = 460;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive || !onClick) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    onClick(
      Math.round(xPercent * 100) / 100,
      Math.round(yPercent * 100) / 100,
    );
  }

  // Filter entries for the current side
  const visibleEntries = entries.filter((entry) => entry.side === side);

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={`w-full max-w-xs mx-auto ${interactive ? 'cursor-crosshair' : ''}`}
      onClick={handleClick}
      role="img"
      aria-label={`Body map — ${side} view. ${visibleEntries.length} markers shown.`}
    >
      {/* Background */}
      <rect
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="oklch(0.98 0.005 160)"
        rx="8"
      />

      {/* Side label */}
      <text
        x="150"
        y="458"
        textAnchor="middle"
        className="text-xs"
        fill="oklch(0.55 0 0)"
        fontSize="11"
      >
        {side === 'front' ? 'Front' : 'Back'}
      </text>

      {/* Human outline */}
      {side === 'front' ? <FrontOutline /> : <BackOutline />}

      {/* Entry markers */}
      {visibleEntries.map((entry) => {
        const cx = (entry.xPercent / 100) * viewBoxWidth;
        const cy = (entry.yPercent / 100) * viewBoxHeight;
        const colour = ENTRY_TYPE_COLOURS[entry.entryType as EntryType] ?? '#6b7280';
        const isSelected = entry.id === selectedEntryId;

        return (
          <g key={entry.id}>
            {/* Selection ring */}
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r="10"
                fill="none"
                stroke={colour}
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            {/* Marker dot */}
            <circle
              cx={cx}
              cy={cy}
              r="6"
              fill={colour}
              opacity="0.8"
              stroke="white"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </svg>
  );
}
