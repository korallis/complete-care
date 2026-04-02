'use server';

import type { QueryResult, SuggestedQuery } from '../types';

/**
 * Process a natural language query (placeholder/mock implementation).
 * In production this would call an LLM to generate a safe SQL-like query,
 * validate it, execute against the DB, and return results.
 */
export async function executeNlQuery(
  organisationId: string,
  queryText: string,
): Promise<{ success: boolean; result?: QueryResult; error?: string }> {
  // Mock implementation — returns sample data based on query keywords
  const lowerQuery = queryText.toLowerCase();

  if (lowerQuery.includes('person') || lowerQuery.includes('service user')) {
    return {
      success: true,
      result: {
        columns: ['Name', 'Status', 'Key Worker', 'Last Review'],
        rows: [
          { Name: 'Alice Johnson', Status: 'Active', 'Key Worker': 'Sarah Smith', 'Last Review': '2026-03-15' },
          { Name: 'Bob Williams', Status: 'Active', 'Key Worker': 'James Brown', 'Last Review': '2026-03-20' },
        ],
        totalCount: 2,
      },
    };
  }

  if (lowerQuery.includes('budget') || lowerQuery.includes('spend')) {
    return {
      success: true,
      result: {
        columns: ['Person', 'Budget', 'Allocated', 'Spent', 'Remaining'],
        rows: [
          { Person: 'Alice Johnson', Budget: '2025/26 DP', Allocated: '12000.00', Spent: '8500.00', Remaining: '3500.00' },
        ],
        totalCount: 1,
      },
    };
  }

  return {
    success: true,
    result: {
      columns: ['Info'],
      rows: [{ Info: 'No matching data found. Try rephrasing your query.' }],
      totalCount: 0,
    },
  };
}

export async function getSuggestedQueries(): Promise<SuggestedQuery[]> {
  return [
    { label: 'All active service users', queryText: 'Show me all active service users' },
    { label: 'Budget summary', queryText: 'What is the budget summary for this quarter?' },
    { label: 'Overdue reviews', queryText: 'Which care plans are overdue for review?' },
    { label: 'Staff on shift today', queryText: 'Who is on shift today?' },
    { label: 'Incidents this month', queryText: 'Show incidents reported this month' },
  ];
}
