/**
 * Simple GAQL (Google Ads Query Language) Parser
 * Handles SELECT, FROM, WHERE clauses for Google Ads API v21
 */

export interface ParsedQuery {
  selectFields: string[];
  from: string;
  whereConditions?: {
    field: string;
    operator: string;
    value: string;
  }[];
  dateRange?: {
    type: 'DURING' | 'BETWEEN';
    value: string;
  };
}

export function parseGAQL(query: string): ParsedQuery {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');

  // Extract SELECT fields
  const selectMatch = normalizedQuery.match(/SELECT\s+(.+?)\s+FROM/i);
  if (!selectMatch) {
    throw new Error('Invalid GAQL: Missing SELECT clause');
  }

  const selectFields = selectMatch[1]
    .split(',')
    .map(field => field.trim());

  // Extract FROM table
  const fromMatch = normalizedQuery.match(/FROM\s+(\w+)/i);
  if (!fromMatch) {
    throw new Error('Invalid GAQL: Missing FROM clause');
  }

  const from = fromMatch[1];

  // Extract WHERE conditions (optional)
  const whereMatch = normalizedQuery.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|$)/i);
  let whereConditions: ParsedQuery['whereConditions'];
  let dateRange: ParsedQuery['dateRange'];

  if (whereMatch) {
    const whereClause = whereMatch[1];

    // Handle DURING date range
    const duringMatch = whereClause.match(/segments\.date\s+DURING\s+(.+?)(?:\s+AND|$)/i);
    if (duringMatch) {
      dateRange = {
        type: 'DURING',
        value: duringMatch[1].trim(),
      };
    }

    // Handle BETWEEN date range
    const betweenMatch = whereClause.match(/segments\.date\s+BETWEEN\s+'(.+?)'\s+AND\s+'(.+?)'/i);
    if (betweenMatch) {
      dateRange = {
        type: 'BETWEEN',
        value: `${betweenMatch[1]} AND ${betweenMatch[2]}`,
      };
    }

    // Parse other WHERE conditions
    const conditionMatches = whereClause.match(/(\w+\.\w+)\s*(=|!=|>|<|>=|<=|IN|NOT IN|LIKE)\s*'?([^']+?)'?(?:\s+AND|\s+OR|$)/gi);
    if (conditionMatches) {
      whereConditions = conditionMatches
        .map(condition => {
          const match = condition.match(/(\w+\.\w+)\s*(=|!=|>|<|>=|<=|IN|NOT IN|LIKE)\s*'?([^']+?)'?(?:\s+AND|\s+OR|$)/i);
          if (match) {
            return {
              field: match[1],
              operator: match[2],
              value: match[3].trim(),
            };
          }
          return null;
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && !c.field.includes('segments.date'));
    }
  }

  return {
    selectFields,
    from,
    whereConditions,
    dateRange,
  };
}

/**
 * Calculate date range for mock data
 */
export function calculateDateRange(dateRange?: ParsedQuery['dateRange']): { startDate: Date; endDate: Date } {
  const today = new Date();
  const endDate = new Date(today);
  let startDate = new Date(today);

  if (!dateRange) {
    // Default to last 30 days
    startDate.setDate(today.getDate() - 30);
    return { startDate, endDate };
  }

  if (dateRange.type === 'DURING') {
    const value = dateRange.value.toUpperCase();

    if (value === 'LAST_7_DAYS') {
      startDate.setDate(today.getDate() - 7);
    } else if (value === 'LAST_14_DAYS') {
      startDate.setDate(today.getDate() - 14);
    } else if (value === 'LAST_30_DAYS') {
      startDate.setDate(today.getDate() - 30);
    } else if (value === 'THIS_MONTH') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (value === 'LAST_MONTH') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate.setDate(0); // Last day of previous month
    } else if (value === 'THIS_YEAR') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else {
      // Default to last 30 days for unknown ranges
      startDate.setDate(today.getDate() - 30);
    }
  } else if (dateRange.type === 'BETWEEN') {
    const [start, end] = dateRange.value.split(' AND ').map(d => d.trim());
    startDate = new Date(start);
    endDate.setTime(new Date(end).getTime());
  }

  return { startDate, endDate };
}

/**
 * Filter data based on WHERE conditions
 */
export function applyWhereConditions<T extends Record<string, any>>(
  data: T[],
  conditions?: ParsedQuery['whereConditions']
): T[] {
  if (!conditions || conditions.length === 0) {
    return data;
  }

  return data.filter(item => {
    return conditions.every(condition => {
      const fieldParts = condition.field.split('.');
      let value: any = item;

      for (const part of fieldParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return false;
        }
      }

      const conditionValue = condition.value;

      switch (condition.operator.toUpperCase()) {
        case '=':
          return String(value) === conditionValue;
        case '!=':
          return String(value) !== conditionValue;
        case '>':
          return Number(value) > Number(conditionValue);
        case '<':
          return Number(value) < Number(conditionValue);
        case '>=':
          return Number(value) >= Number(conditionValue);
        case '<=':
          return Number(value) <= Number(conditionValue);
        case 'IN':
          const inValues = conditionValue.replace(/[()]/g, '').split(',').map(v => v.trim());
          return inValues.includes(String(value));
        case 'NOT IN':
          const notInValues = conditionValue.replace(/[()]/g, '').split(',').map(v => v.trim());
          return !notInValues.includes(String(value));
        case 'LIKE':
          const pattern = conditionValue.replace(/%/g, '.*');
          return new RegExp(pattern, 'i').test(String(value));
        default:
          return true;
      }
    });
  });
}

/**
 * Extract only selected fields from data
 */
export function selectFields<T extends Record<string, any>>(
  data: T[],
  fields: string[]
): Record<string, any>[] {
  return data.map(item => {
    const result: Record<string, any> = {};

    for (const field of fields) {
      const parts = field.split('.');
      let value: any = item;
      let current = result;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (value && typeof value === 'object' && part in value) {
          value = value[part];

          if (i < parts.length - 1) {
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          } else {
            current[part] = value;
          }
        }
      }
    }

    return result;
  });
}
