import type { DateRange, DateRangePreset } from './types';

export function buildDateRange(preset: DateRangePreset): DateRange {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case 'ytd':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      from.setDate(from.getDate() - 30);
      break;
  }

  return { preset, from, to };
}
