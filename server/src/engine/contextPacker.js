/**
 * Context Window & Thread Enrichment Packer
 *
 * Solves the "ripped out of context" problem where terse messages like:
 *   "bhai tickets ho gayi pack karlo sab"
 * contain zero mentions of "Manali" or "vacation" in isolation.
 *
 * By embedding each message along with its conversational envelope (±2 messages),
 * the semantic vector inherits the topic, entities, and intent of the thread.
 */

const DECISION_PATTERNS = [
  /tickets ho gayi/i,
  /pack karlo/i,
  /transfer kar diya/i,
  /mangwa liye/i,
  /slot book/i,
  /book kar diya/i,
  /fix hai/i,
  /done scene/i,
  /booked/i,
  /order kar/i,
  /agreement.*sign/i,
  /stamp paper/i,
  /confirm/i,
  /settle up/i,
  /splitwise.*daal diya/i
];

export function hasDecisionSignal(text) {
  return DECISION_PATTERNS.some(pattern => pattern.test(text));
}

export function packMessageContext(messages, windowSize = 2, maxTimeGapHours = 4) {
  return messages.map((msg, idx) => {
    const msgTime = new Date(msg.timestamp).getTime();

    // Collect preceding messages within time window
    const prevContext = [];
    for (let j = Math.max(0, idx - windowSize); j < idx; j++) {
      const prevTime = new Date(messages[j].timestamp).getTime();
      const diffHours = (msgTime - prevTime) / (1000 * 60 * 60);
      if (diffHours <= maxTimeGapHours) {
        prevContext.push(`${messages[j].sender}: ${messages[j].text}`);
      }
    }

    // Collect succeeding messages within time window
    const nextContext = [];
    for (let j = idx + 1; j <= Math.min(messages.length - 1, idx + windowSize); j++) {
      const nextTime = new Date(messages[j].timestamp).getTime();
      const diffHours = (nextTime - msgTime) / (1000 * 60 * 60);
      if (diffHours <= maxTimeGapHours) {
        nextContext.push(`${messages[j].sender}: ${messages[j].text}`);
      }
    }

    const contextParts = [];
    if (prevContext.length > 0) {
      contextParts.push(`Preceding: ${prevContext.join(' | ')}`);
    }
    if (nextContext.length > 0) {
      contextParts.push(`Following: ${nextContext.join(' | ')}`);
    }

    const contextStr = contextParts.length > 0 ? ` | Conversation Envelope [${contextParts.join(' -- ')}]` : '';
    const enrichedText = `${msg.sender}: ${msg.text}${contextStr}`;

    return {
      id: msg.id,
      sender: msg.sender,
      timestamp: msg.timestamp,
      text: msg.text,
      is_decision: hasDecisionSignal(msg.text),
      enriched_text: enrichedText
    };
  });
}
