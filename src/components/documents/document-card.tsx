'use client';

/**
 * DocumentCard — displays document info with download link and metadata.
 */

import { FileText, Image as ImageIcon, File, Download, Clock, Tag } from 'lucide-react';
import type { DocumentListItem } from '@/features/documents/actions';
import { formatFileSize, formatDocumentDate } from '@/features/documents/schema';
import {
  DOCUMENT_CATEGORY_LABELS,
  RETENTION_POLICY_LABELS,
  type DocumentCategory,
  type RetentionPolicy,
} from '@/features/documents/constants';

type DocumentCardProps = {
  document: DocumentListItem;
};

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-700" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const categoryLabel =
    DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory] ?? doc.category;
  const retentionLabel =
    RETENTION_POLICY_LABELS[doc.retentionPolicy as RetentionPolicy] ?? doc.retentionPolicy;

  return (
    <article
      className="rounded-lg border border-[oklch(0.85_0.02_160)] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Document: ${doc.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          <FileIcon mimeType={doc.fileType} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-[oklch(0.25_0.02_160)] truncate">
              {doc.name}
            </h3>
            <a
              href={doc.storageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-md p-1.5 text-[oklch(0.45_0.06_160)] hover:bg-[oklch(0.95_0.02_160)] transition-colors"
              aria-label={`Download ${doc.name}`}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>

          <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5 truncate">
            {doc.fileName}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Category badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.95_0.02_160)] px-2 py-0.5 text-xs font-medium text-[oklch(0.35_0.06_160)]">
              <Tag className="h-3 w-3" />
              {categoryLabel}
            </span>

            {/* Version badge */}
            {doc.version > 1 && (
              <span className="inline-flex items-center rounded-full bg-[oklch(0.92_0.04_250)] px-2 py-0.5 text-xs font-medium text-[oklch(0.35_0.06_250)]">
                v{doc.version}
              </span>
            )}

            {/* File size */}
            <span className="text-xs text-[oklch(0.55_0_0)]">
              {formatFileSize(doc.fileSize)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-[oklch(0.55_0_0)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDocumentDate(doc.createdAt)}
            </span>
            {doc.uploadedByName && (
              <span>by {doc.uploadedByName}</span>
            )}
          </div>

          <div className="mt-1 text-xs text-[oklch(0.6_0_0)]">
            Retention: {retentionLabel}
          </div>
        </div>
      </div>
    </article>
  );
}
