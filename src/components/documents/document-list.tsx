'use client';

/**
 * DocumentList — filterable, paginated list of documents.
 *
 * Filters: category.
 * Includes upload form toggle and empty state.
 */

import { useState, useTransition } from 'react';
import { Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocumentCard } from './document-card';
import { DocumentUploadForm } from './document-upload-form';
import type { DocumentListResult } from '@/features/documents/actions';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
} from '@/features/documents/constants';

type DocumentListProps = {
  initialData: DocumentListResult;
  personId: string;
  orgSlug: string;
  canCreate: boolean;
  onFilter: (filters: {
    personId?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<DocumentListResult>;
};

export function DocumentList({
  initialData,
  personId,
  orgSlug,
  canCreate,
  onFilter,
}: DocumentListProps) {
  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();

  function applyFilter(newCategory: string, newPage?: number) {
    startTransition(async () => {
      const result = await onFilter({
        personId,
        category: newCategory || undefined,
        page: newPage ?? 1,
        pageSize: 25,
      });
      setData(result);
    });
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    applyFilter(value);
  }

  function handlePageChange(page: number) {
    applyFilter(category, page);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.25_0.02_160)]">
            Documents
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            {data.totalCount} {data.totalCount === 1 ? 'document' : 'documents'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.35_0.06_160)] px-3 py-2 text-sm font-medium text-white hover:bg-[oklch(0.3_0.06_160)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && canCreate && (
        <div className="rounded-lg border border-[oklch(0.85_0.02_160)] bg-[oklch(0.98_0.005_160)] p-4">
          <h3 className="text-sm font-semibold text-[oklch(0.25_0.02_160)] mb-3">
            Upload New Document
          </h3>
          <DocumentUploadForm
            personId={personId}
            orgSlug={orgSlug}
            onSuccess={() => {
              setShowUpload(false);
              applyFilter(category);
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 items-end"
        role="search"
        aria-label="Filter documents"
      >
        <div className="space-y-1">
          <label
            htmlFor="filter-category"
            className="text-xs font-medium text-[oklch(0.45_0_0)]"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={isPending}
            className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {DOCUMENT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document grid */}
      {data.documents.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed border-[oklch(0.8_0.02_160)]">
          <FileText className="mx-auto h-10 w-10 text-[oklch(0.7_0_0)]" />
          <p className="mt-3 text-sm text-[oklch(0.5_0_0)]">
            No documents found.
          </p>
          {canCreate && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-2 text-sm text-[oklch(0.35_0.06_160)] hover:underline"
            >
              Upload the first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3" role="list" aria-label="Documents">
          {data.documents.map((doc) => (
            <div key={doc.id} role="listitem">
              <DocumentCard document={doc} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page <= 1 || isPending}
              className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[oklch(0.95_0.02_160)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page >= data.totalPages || isPending}
              className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[oklch(0.95_0.02_160)] transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
