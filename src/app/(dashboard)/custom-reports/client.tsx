'use client';

import { ReportBuilder } from '@/features/custom-reports';
import { getDataSources } from '@/features/custom-reports/actions';
import { useState, useEffect } from 'react';
import type { DataSourceSchema } from '@/features/custom-reports/types';

export function CustomReportsClient() {
  const [dataSources, setDataSources] = useState<DataSourceSchema[]>([]);

  useEffect(() => {
    getDataSources().then(setDataSources);
  }, []);

  return (
    <ReportBuilder
      dataSources={dataSources}
      onSave={(config) => {
        // TODO: Wire to createReport server action
        console.log('Report saved:', config);
      }}
    />
  );
}
