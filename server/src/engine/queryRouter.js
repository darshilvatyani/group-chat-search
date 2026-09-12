import { parseTemporalRange } from './temporalParser.js';
import { expandQueryWithHinglish } from './hinglishNormalizer.js';
import { embedText } from './embeddingEngine.js';
import { vectorStore } from './vectorStore.js';

const KNOWN_PARTICIPANTS = [
  'Aarav',
  'Priya',
  'Kabir',
  'Rohan',
  'Sneha',
  'Ananya',
  'Vikram',
  'Neha'
];

const DECISION_KEYWORDS = /\b(decide|decided|decision|locked in|conclude|concluded|finalized|agree|agreed|confirm|confirmed|chose|reserve|reservation|book|booked|pay|paid|token)\b/i;

export function analyzeQuery(rawQuery) {
  let cleaned = rawQuery.trim();
  let detectedSpeaker = null;
  let queryType = 'semantic';

  // 1. Speaker / Entity Detection
  for (const participant of KNOWN_PARTICIPANTS) {
    const speakerPattern = new RegExp(`\\b(what did|did|when did|why did|how did)?\\s*${participant}\\b|\\b${participant}('s)?\\b`, 'i');
    if (speakerPattern.test(cleaned)) {
      detectedSpeaker = participant;
      queryType = 'speaker';
      // Clean query text for semantic matching while preserving topic
      cleaned = cleaned.replace(new RegExp(`\\b${participant}('s)?\\b`, 'gi'), '').trim();
      break;
    }
  }

  // 2. Temporal Range Detection
  const temporal = parseTemporalRange(cleaned);
  if (temporal.hasTemporal) {
    cleaned = temporal.cleanQuery;
    if (queryType === 'semantic') {
      queryType = 'temporal';
    }
  }

  // 3. Decision Intent Detection
  const isDecision = DECISION_KEYWORDS.test(rawQuery);
  if (isDecision && queryType === 'semantic') {
    queryType = 'decision';
  }

  // 4. Hinglish Expansion
  const expandedQuery = expandQueryWithHinglish(cleaned);

  return {
    rawQuery,
    cleanedQuery: cleaned,
    expandedQuery,
    queryType,
    isDecision,
    filter: {
      sender: detectedSpeaker,
      startTime: temporal.startTime,
      endTime: temporal.endTime
    },
    temporalMeta: temporal.hasTemporal ? {
      matched: temporal.matchedText,
      start: temporal.startTime,
      end: temporal.endTime
    } : null
  };
}

export async function executeSearch(rawQuery, options = {}) {
  const topK = options.topK || 5;
  const t0 = Date.now();

  const analysis = analyzeQuery(rawQuery);

  // Generate embedding using expanded semantic representation
  const queryVector = await embedText(analysis.expandedQuery);

  // Execute filtered vector search
  const rawResults = vectorStore.search(queryVector, {
    filter: analysis.filter,
    decisionBoost: analysis.isDecision,
    topK
  });

  const searchDurationMs = Date.now() - t0;

  // Enhance each result with its conversational neighborhood
  const resultsWithContext = rawResults.map(r => {
    const context = vectorStore.getContextWindow(r.message.id, 4);
    return {
      id: r.message.id,
      sender: r.message.sender,
      timestamp: r.message.timestamp,
      text: r.message.text,
      score: Number(r.score.toFixed(4)),
      raw_score: Number(r.raw_score.toFixed(4)),
      is_decision: r.message.is_decision,
      context_window: context ? context.window : []
    };
  });

  return {
    query: rawQuery,
    analysis,
    search_duration_ms: searchDurationMs,
    total_candidates_scanned: vectorStore.messages.length,
    results: resultsWithContext
  };
}
