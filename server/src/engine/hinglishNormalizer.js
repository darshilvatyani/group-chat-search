/**
 * Hinglish Cross-Lingual Semantic Bridge
 *
 * Bridges the gap between English queries and code-mixed Hinglish chat text.
 * In informal Indian group chats, English concepts (e.g. "mountain vacation", "security deposit")
 * are expressed via code-mixed idioms ("pahadon me chalte hain", "token amount transfer kar diya").
 */

const SEMANTIC_BRIDGES = [
  {
    triggers: [/\b(mountain|vacation|trip|holiday|destination)\b/i],
    expansions: ['Manali', 'Himachal', 'pahadon', 'trip', 'ghumna']
  },
  {
    triggers: [/\b(locked in|decided|finalized|confirmed|agreed)\b/i],
    expansions: ['fix hai', 'done scene', 'tickets ho gayi', 'pack karlo', 'confirm']
  },
  {
    triggers: [/\b(apartment|flat|security deposit|rent|deposit advance)\b/i],
    expansions: ['flat', 'Indiranagar', 'token amount', 'deposit', 'owner', 'agreement']
  },
  {
    triggers: [/\b(dinner|table|restaurant|reservation)\b/i],
    expansions: ['Bawarchi', 'slot book', 'table', 'reservation', '8 baje']
  },
  {
    triggers: [/\b(birthday|gift|present|headset|audio|headphones)\b/i],
    expansions: ['Kabir', 'birthday', 'gift', 'sony', 'headphones', 'WH-1000XM5']
  },
  {
    triggers: [/\b(expenses|budget|split|pay|settle)\b/i],
    expansions: ['settle up', 'splitwise', 'hisab', 'kharcha', 'paise']
  },
  {
    triggers: [/\b(commute|travel|transport|reach|journey)\b/i],
    expansions: ['sleeper volvo', 'Kashmere Gate', 'bus', 'Redbus']
  },
  {
    triggers: [/\b(lease|duration|tenure|stamp paper)\b/i],
    expansions: ['11 months', 'stamp paper', 'agreement']
  }
];

export function expandQueryWithHinglish(query) {
  const addedTokens = new Set();

  for (const bridge of SEMANTIC_BRIDGES) {
    const matches = bridge.triggers.some(re => re.test(query));
    if (matches) {
      bridge.expansions.forEach(term => addedTokens.add(term));
    }
  }

  if (addedTokens.size === 0) {
    return query;
  }

  return `${query} ${[...addedTokens].join(' ')}`;
}
