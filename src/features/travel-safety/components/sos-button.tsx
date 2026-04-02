'use client';

import { useState, useCallback } from 'react';

interface SosButtonProps {
  onTrigger: (position?: { latitude: number; longitude: number; accuracyMetres?: number }) => void;
  disabled?: boolean;
}

/**
 * SOS emergency button — requires press-and-hold for 2 seconds to activate,
 * preventing accidental triggers. Captures GPS position on activation.
 */
export function SosButton({ onTrigger, disabled = false }: SosButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [triggered, setTriggered] = useState(false);

  const handlePressStart = useCallback(() => {
    if (disabled || triggered) return;

    setIsHolding(true);

    const timer = setTimeout(() => {
      setTriggered(true);
      setIsHolding(false);

      // Attempt to get GPS position
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            onTrigger({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracyMetres: pos.coords.accuracy,
            });
          },
          () => {
            // GPS unavailable — trigger without location
            onTrigger();
          },
          { enableHighAccuracy: true, timeout: 5000 },
        );
      } else {
        onTrigger();
      }
    }, 2000);

    setHoldTimer(timer);
  }, [disabled, triggered, onTrigger]);

  const handlePressEnd = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setIsHolding(false);
  }, [holdTimer]);

  if (triggered) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
          <span className="text-xs font-bold text-center leading-tight">
            SOS
            <br />
            SENT
          </span>
        </div>
        <p className="text-xs text-red-600 font-medium">
          Help is on the way. Stay where you are.
        </p>
        <button
          type="button"
          onClick={() => setTriggered(false)}
          className="text-xs text-gray-500 underline"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className={`flex h-20 w-20 items-center justify-center rounded-full text-white font-bold text-lg transition-all disabled:opacity-50 ${
          isHolding
            ? 'bg-red-700 scale-110 ring-4 ring-red-300'
            : 'bg-red-500 hover:bg-red-600 active:scale-95'
        }`}
        aria-label="SOS emergency button - hold for 2 seconds to activate"
      >
        SOS
      </button>
      <p className="text-xs text-gray-500 text-center">
        {isHolding ? 'Keep holding...' : 'Hold for 2 seconds to send alert'}
      </p>
    </div>
  );
}
