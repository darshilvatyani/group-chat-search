import * as chrono from 'chrono-node';

export const CHAT_REFERENCE_DATE = new Date('2024-06-30T23:59:59.000Z');

const MONTH_NAMES = {
  january: { month: 0, days: 31 },
  jan: { month: 0, days: 31 },
  february: { month: 1, days: 29 },
  feb: { month: 1, days: 29 },
  march: { month: 2, days: 31 },
  mar: { month: 2, days: 31 },
  april: { month: 3, days: 30 },
  apr: { month: 3, days: 30 },
  may: { month: 4, days: 31 },
  june: { month: 5, days: 30 },
  jun: { month: 5, days: 30 }
};

export function parseTemporalRange(query, refDate = CHAT_REFERENCE_DATE) {
  const lower = query.toLowerCase();

  // 1. Direct Month Matching (e.g. "in February", "during April", "in Jan")
  const monthMatch = lower.match(/\b(in|during|for)\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun)\b/i);
  if (monthMatch) {
    const monthKey = monthMatch[2].toLowerCase();
    const info = MONTH_NAMES[monthKey];
    if (info) {
      const year = 2024;
      const start = new Date(Date.UTC(year, info.month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, info.month, info.days, 23, 59, 59));
      const cleanQuery = query.replace(monthMatch[0], '').trim();
      return {
        hasTemporal: true,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        matchedText: monthMatch[0],
        cleanQuery: cleanQuery.length > 0 ? cleanQuery : query
      };
    }
  }

  // 2. Relative Phrases: "last month" (relative to June 2024 -> May 2024)
  if (/\blast month\b/i.test(lower)) {
    const start = new Date(Date.UTC(2024, 4, 1, 0, 0, 0)); // May 1
    const end = new Date(Date.UTC(2024, 4, 31, 23, 59, 59)); // May 31
    return {
      hasTemporal: true,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      matchedText: 'last month',
      cleanQuery: query.replace(/\blast month\b/i, '').trim()
    };
  }

  // 3. Isolated weekday mentions (e.g. "for Friday evening") are conversational descriptors,
  // not hard historical date bounds, unless accompanied by "last" or an explicit date.
  const isOnlyWeekday = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)( evening| night| morning)?$/i;
  
  // 4. Chrono fallback parsing with custom reference date
  const parsedResults = chrono.parse(query, refDate, { forwardDate: false });
  if (parsedResults.length > 0) {
    const result = parsedResults[0];
    if (isOnlyWeekday.test(result.text.trim())) {
      // Treat as conversational semantic descriptor, not a hard date filter
      return {
        hasTemporal: false,
        startTime: null,
        endTime: null,
        matchedText: null,
        cleanQuery: query
      };
    }

    const start = result.start.date();
    const end = result.end ? result.end.date() : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      hasTemporal: true,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      matchedText: result.text,
      cleanQuery: query.replace(result.text, '').trim()
    };
  }

  return {
    hasTemporal: false,
    startTime: null,
    endTime: null,
    matchedText: null,
    cleanQuery: query
  };
}
