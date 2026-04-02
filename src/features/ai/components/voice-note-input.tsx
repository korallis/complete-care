'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceNoteInputProps {
  /** Callback fired when text is captured (either via speech or typed). */
  onCapture: (text: string) => void;
  /** Placeholder text for the fallback input. */
  placeholder?: string;
  /** Optional CSS class name for the root container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Speech recognition type (Web Speech API)
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent {
  results: {
    readonly length: number;
    item(index: number): { item(index: number): { transcript: string } };
    [index: number]: { [index: number]: { transcript: string } };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Voice-to-text input with Web Speech API support.
 * Falls back gracefully to a standard text area when speech recognition
 * is not available (e.g. Firefox, server-side).
 */
export function VoiceNoteInput({
  onCapture,
  placeholder = 'Tap the microphone to dictate or type your note...',
  className,
}: VoiceNoteInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check for Web Speech API support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(supported);
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported) return;

    try {
      const SpeechRecognition =
        (
          window as unknown as {
            SpeechRecognition: new () => SpeechRecognitionInstance;
          }
        ).SpeechRecognition ??
        (
          window as unknown as {
            webkitSpeechRecognition: new () => SpeechRecognitionInstance;
          }
        ).webkitSpeechRecognition;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-GB';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => prev + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setSpeechSupported(false);
    }
  }, [speechSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleCapture = useCallback(() => {
    if (text.trim()) {
      onCapture(text.trim());
      setText('');
    }
  }, [text, onCapture]);

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* Microphone button */}
        {speechSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
            className={`absolute right-2 top-2 rounded-full p-2 transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <MicrophoneIcon />
          </button>
        )}
      </div>

      {/* Status */}
      {isListening && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Listening... Speak clearly into your microphone.
        </p>
      )}

      {!speechSupported && (
        <p className="text-xs text-muted-foreground">
          Voice dictation is not supported in this browser. Please type your
          note.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!text.trim()}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          Use Note
        </button>
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function MicrophoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
