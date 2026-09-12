import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cosineSimilarity } from './embeddingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VectorStore {
  constructor() {
    this.messages = [];
    this.embeddings = [];
    this.idMap = new Map();
    this.isLoaded = false;
  }

  load(messages, embeddings) {
    if (messages.length !== embeddings.length) {
      throw new Error(`Length mismatch: ${messages.length} messages vs ${embeddings.length} embeddings`);
    }
    this.messages = messages;
    this.embeddings = embeddings;
    this.idMap.clear();
    for (let i = 0; i < messages.length; i++) {
      this.idMap.set(messages[i].id, i);
    }
    this.isLoaded = true;
  }

  loadFromDisk() {
    const enrichedPath = path.join(__dirname, '../../data/enriched_corpus.json');
    const binPath = path.join(__dirname, '../../data/embeddings.bin');

    if (!fs.existsSync(enrichedPath) || !fs.existsSync(binPath)) {
      throw new Error('Precomputed index not found. Run "npm run index:corpus" first.');
    }

    const messages = JSON.parse(fs.readFileSync(enrichedPath, 'utf-8'));
    const buffer = fs.readFileSync(binPath);

    const dim = 384;
    const count = messages.length;
    const embeddings = [];

    for (let i = 0; i < count; i++) {
      const vec = new Float32Array(dim);
      for (let d = 0; d < dim; d++) {
        vec[d] = buffer.readFloatLE((i * dim + d) * 4);
      }
      embeddings.push(vec);
    }

    this.load(messages, embeddings);
    return this.messages.length;
  }

  getMessageById(id) {
    const idx = this.idMap.get(id);
    return idx !== undefined ? this.messages[idx] : null;
  }

  getContextWindow(targetId, windowSize = 5) {
    const idx = this.idMap.get(targetId);
    if (idx === undefined) return null;

    const startIdx = Math.max(0, idx - windowSize);
    const endIdx = Math.min(this.messages.length - 1, idx + windowSize);

    return {
      target_id: targetId,
      window: this.messages.slice(startIdx, endIdx + 1).map(m => ({
        id: m.id,
        sender: m.sender,
        timestamp: m.timestamp,
        text: m.text,
        is_target: m.id === targetId,
        is_decision: m.is_decision
      }))
    };
  }

  search(queryVector, options = {}) {
    if (!this.isLoaded) {
      this.loadFromDisk();
    }

    const {
      filter = {},
      decisionBoost = false,
      topK = 5
    } = options;

    const { sender, startTime, endTime } = filter;
    const startMs = startTime ? new Date(startTime).getTime() : null;
    const endMs = endTime ? new Date(endTime).getTime() : null;

    const results = [];

    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];

      // Metadata Filter: Sender
      if (sender && msg.sender.toLowerCase() !== sender.toLowerCase()) {
        continue;
      }

      // Metadata Filter: Time Range
      if (startMs !== null || endMs !== null) {
        const msgMs = new Date(msg.timestamp).getTime();
        if (startMs !== null && msgMs < startMs) continue;
        if (endMs !== null && msgMs > endMs) continue;
      }

      const rawScore = cosineSimilarity(queryVector, this.embeddings[i]);
      let finalScore = rawScore;

      // Decision boost: prioritizes messages representing closure / resolution
      if (decisionBoost && msg.is_decision) {
        finalScore += 0.12;
      }

      results.push({
        message: msg,
        score: finalScore,
        raw_score: rawScore
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

export const vectorStore = new VectorStore();
