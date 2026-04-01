'use client';

/**
 * DocumentUploadForm — file input with category picker and retention tag.
 *
 * NOTE: In production, the file upload would go through a presigned URL flow
 * (e.g., Vercel Blob or S3). For this MVP, we simulate the upload by accepting
 * a file and creating a placeholder storageUrl.
 */

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { uploadDocument } from '@/features/documents/actions';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  RETENTION_POLICIES,
  RETENTION_POLICY_LABELS,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  type DocumentCategory,
  type RetentionPolicy,
} from '@/features/documents/constants';
import { formatFileSize } from '@/features/documents/schema';

type DocumentUploadFormProps = {
  personId: string;
  orgSlug: string;
  onSuccess?: () => void;
};

export function DocumentUploadForm({
  personId,
  onSuccess,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>('standard');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!name) {
      setName(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  function handleClearFile() {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !name.trim()) return;

    startTransition(async () => {
      // In production, upload to blob storage first and get the URL.
      // For MVP, we use a placeholder URL.
      const storageUrl = `/api/documents/placeholder/${encodeURIComponent(selectedFile.name)}`;

      const result = await uploadDocument({
        personId,
        name: name.trim(),
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        category,
        retentionPolicy,
        storageUrl,
      });

      if (result.success) {
        toast.success('Document uploaded successfully');
        setSelectedFile(null);
        setName('');
        setCategory('other');
        setRetentionPolicy('standard');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(result.error);
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File input */}
      <div className="space-y-1.5">
        <label
          htmlFor="document-file"
          className="text-sm font-medium text-[oklch(0.25_0.02_160)]"
        >
          File
        </label>
        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-md border border-[oklch(0.85_0.02_160)] bg-[oklch(0.97_0.01_160)] p-3">
            <Upload className="h-4 w-4 text-[oklch(0.45_0.06_160)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-[oklch(0.55_0_0)]">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="rounded-md p-1 hover:bg-[oklch(0.9_0.02_160)] transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            id="document-file"
            type="file"
            accept={ALLOWED_FILE_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        )}
      </div>

      {/* Document name */}
      <div className="space-y-1.5">
        <label
          htmlFor="document-name"
          className="text-sm font-medium text-[oklch(0.25_0.02_160)]"
        >
          Document Name
        </label>
        <input
          id="document-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Initial Assessment Report"
          maxLength={255}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Category + Retention row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="document-category"
            className="text-sm font-medium text-[oklch(0.25_0.02_160)]"
          >
            Category
          </label>
          <select
            id="document-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {DOCUMENT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="document-retention"
            className="text-sm font-medium text-[oklch(0.25_0.02_160)]"
          >
            Retention Policy
          </label>
          <select
            id="document-retention"
            value={retentionPolicy}
            onChange={(e) => setRetentionPolicy(e.target.value as RetentionPolicy)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {RETENTION_POLICIES.map((pol) => (
              <option key={pol} value={pol}>
                {RETENTION_POLICY_LABELS[pol]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !selectedFile || !name.trim()}
        className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.3_0.06_160)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload className="h-4 w-4" />
        {isPending ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}
