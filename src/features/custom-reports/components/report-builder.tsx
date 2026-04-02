'use client';

import { useState } from 'react';
import type { DataSourceSchema, ColumnDefinition, FilterDefinition, ExportFormat } from '../types';

const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'between', label: 'Between' },
];

export function ReportBuilder({
  dataSources,
  onSave,
}: {
  dataSources: DataSourceSchema[];
  onSave?: (config: {
    name: string;
    dataSource: string;
    columns: ColumnDefinition[];
    filters: FilterDefinition[];
    groupBy: string[];
    exportFormat: ExportFormat;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSourceSchema | null>(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [filters, setFilters] = useState<FilterDefinition[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  function handleSourceChange(sourceName: string) {
    const source = dataSources.find((ds) => ds.name === sourceName) ?? null;
    setSelectedSource(source);
    setColumns(source?.availableColumns ?? []);
    setFilters([]);
    setGroupBy([]);
  }

  function toggleColumn(field: string) {
    setColumns((prev) =>
      prev.map((col) =>
        col.field === field ? { ...col, visible: !col.visible } : col,
      ),
    );
  }

  function addFilter() {
    if (!selectedSource) return;
    setFilters((prev) => [
      ...prev,
      { field: selectedSource.availableColumns[0]?.field ?? '', operator: 'equals', value: '' },
    ]);
  }

  function removeFilter(idx: number) {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateFilter(idx: number, updates: Partial<FilterDefinition>) {
    setFilters((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Report name */}
      <div>
        <label htmlFor="reportName" className="mb-1 block text-sm font-medium">
          Report Name
        </label>
        <input
          id="reportName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="My Custom Report"
        />
      </div>

      {/* Data source */}
      <div>
        <label htmlFor="dataSource" className="mb-1 block text-sm font-medium">
          Data Source
        </label>
        <select
          id="dataSource"
          value={selectedSource?.name ?? ''}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select data source...</option>
          {dataSources.map((ds) => (
            <option key={ds.name} value={ds.name}>
              {ds.label}
            </option>
          ))}
        </select>
      </div>

      {/* Columns */}
      {selectedSource && (
        <fieldset className="rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Columns</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {columns.map((col) => (
              <label key={col.field} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumn(col.field)}
                  className="h-4 w-4"
                />
                {col.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Filters */}
      {selectedSource && (
        <fieldset className="rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Filters</legend>
          <div className="space-y-2">
            {filters.map((filter, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(idx, { field: e.target.value })}
                  className="rounded-md border px-2 py-1.5 text-sm"
                >
                  {columns.map((col) => (
                    <option key={col.field} value={col.field}>
                      {col.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(idx, { operator: e.target.value })}
                  className="rounded-md border px-2 py-1.5 text-sm"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(idx, { value: e.target.value })}
                  className="flex-1 rounded-md border px-2 py-1.5 text-sm"
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={() => removeFilter(idx)}
                  className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFilter}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              + Add Filter
            </button>
          </div>
        </fieldset>
      )}

      {/* Group By */}
      {selectedSource && (
        <fieldset className="rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Group By</legend>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <label key={col.field} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupBy.includes(col.field)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setGroupBy((prev) => [...prev, col.field]);
                    } else {
                      setGroupBy((prev) => prev.filter((f) => f !== col.field));
                    }
                  }}
                  className="h-4 w-4"
                />
                {col.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Export format */}
      <div>
        <label className="mb-1 block text-sm font-medium">Export Format</label>
        <div className="flex gap-4">
          {(['csv', 'pdf', 'both'] as const).map((fmt) => (
            <label key={fmt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="exportFormat"
                value={fmt}
                checked={exportFormat === fmt}
                onChange={() => setExportFormat(fmt)}
                className="h-4 w-4"
              />
              {fmt.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => {
            if (!selectedSource || !name.trim()) return;
            onSave?.({
              name,
              dataSource: selectedSource.name,
              columns,
              filters,
              groupBy,
              exportFormat,
            });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Save Report
        </button>
      </div>
    </div>
  );
}
