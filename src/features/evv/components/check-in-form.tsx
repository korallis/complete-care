'use client';

import { useState } from 'react';
import { MapPin, QrCode, Smartphone, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationMethod } from '../constants';

interface CheckInFormProps {
  visitId: string;
  clientName: string;
  clientAddress: string;
  onCheckIn: (data: {
    latitude: number;
    longitude: number;
    accuracyMetres?: number;
    verificationMethod: VerificationMethod;
    verificationPayload?: string;
  }) => Promise<void>;
  className?: string;
}

const methods: { id: VerificationMethod; label: string; icon: typeof MapPin; desc: string }[] = [
  { id: 'gps', label: 'GPS', icon: MapPin, desc: 'Verify with device location' },
  { id: 'qr_code', label: 'QR Code', icon: QrCode, desc: 'Scan client QR code' },
  { id: 'nfc', label: 'NFC', icon: Smartphone, desc: 'Tap NFC tag at location' },
  { id: 'manual_override', label: 'Manual', icon: Shield, desc: 'Manual override (requires approval)' },
];

/**
 * Check-in form — allows carers to verify their arrival at a client location.
 * Supports GPS, QR code, NFC, and manual override methods.
 */
export function CheckInForm({
  visitId,
  clientName,
  clientAddress,
  onCheckIn,
  className,
}: CheckInFormProps) {
  void visitId;
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>('gps');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'ready' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function acquireGps() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this device');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('acquiring');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsStatus('ready');
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  async function handleSubmit() {
    if (!coords && selectedMethod === 'gps') {
      setError('Please acquire GPS coordinates first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCheckIn({
        latitude: coords?.lat ?? 0,
        longitude: coords?.lon ?? 0,
        accuracyMetres: coords?.accuracy,
        verificationMethod: selectedMethod,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card p-5', className)}>
      <h3 className="text-sm font-medium text-foreground">Check In</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {clientName} &middot; {clientAddress}
      </p>

      {/* Verification method selector */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors',
                selectedMethod === method.id
                  ? 'border-foreground bg-foreground/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-medium">{method.label}</p>
                <p className="text-[10px] opacity-70">{method.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* GPS acquisition */}
      {selectedMethod === 'gps' && (
        <div className="mt-4">
          {gpsStatus === 'idle' && (
            <button
              type="button"
              onClick={acquireGps}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
              Acquire GPS Location
            </button>
          )}
          {gpsStatus === 'acquiring' && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Acquiring location...
            </div>
          )}
          {gpsStatus === 'ready' && coords && (
            <div className="rounded-md bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
              <p className="font-medium">Location acquired</p>
              <p className="mt-0.5 tabular-nums opacity-80">
                {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}
                {coords.accuracy != null && ` (${Math.round(coords.accuracy)}m accuracy)`}
              </p>
            </div>
          )}
          {gpsStatus === 'error' && (
            <div className="space-y-2">
              <div className="rounded-md bg-red-50 px-4 py-2.5 text-xs text-red-700">
                {error}
              </div>
              <button
                type="button"
                onClick={acquireGps}
                className="w-full rounded-md border border-border px-4 py-2 text-xs text-foreground hover:bg-muted"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR / NFC placeholders */}
      {selectedMethod === 'qr_code' && (
        <div className="mt-4 rounded-md border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          <QrCode className="mx-auto h-8 w-8 opacity-30" />
          <p className="mt-2">Camera will open to scan QR code</p>
        </div>
      )}
      {selectedMethod === 'nfc' && (
        <div className="mt-4 rounded-md border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          <Smartphone className="mx-auto h-8 w-8 opacity-30" />
          <p className="mt-2">Hold device near NFC tag</p>
        </div>
      )}

      {/* Error display */}
      {error && gpsStatus !== 'error' && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || (selectedMethod === 'gps' && gpsStatus !== 'ready')}
        className={cn(
          'mt-4 w-full rounded-md px-4 py-2.5 text-xs font-medium transition-colors',
          'bg-foreground text-background hover:bg-foreground/90',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
            Checking in...
          </>
        ) : (
          'Confirm Check-In'
        )}
      </button>
    </div>
  );
}
