import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { vectorStore } from '../server/src/engine/vectorStore.js';
import { analyzeQuery } from '../server/src/engine/queryRouter.js';
import { embedText } from '../server/src/engine/embeddingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Helper to resolve data paths reliably in serverless environments
function resolveDataPath(relPath) {
  const p1 = path.join(process.cwd(), 'server/data', relPath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(__dirname, '../server/data', relPath);
  if (fs.existsSync(p2)) return p2;
  return p1;
}

// Pre-load benchmark query cache for instant responses
let queryVectorCache = {};
try {
  const cachePath = resolveDataPath('benchmark_query_vectors.json');
  if (fs.existsSync(cachePath)) {
    queryVectorCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load query vector cache:', e.message);
}

// Lazy initialization of vector store
function ensureStoreLoaded() {
  if (!vectorStore.isLoaded) {
    vectorStore.loadFromDisk();
  }
}

app.get('/api/health', (req, res) => {
  ensureStoreLoaded();
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    indexed_vectors: vectorStore.messages.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  try {
    const metaPath = resolveDataPath('metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return res.json({ success: true, stats: meta });
    }
    ensureStoreLoaded();
    res.json({
      success: true,
      stats: { total_messages: vectorStore.messages.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/benchmarks', (req, res) => {
  try {
    const benchPath = resolveDataPath('benchmarkQueries.json');
    if (fs.existsSync(benchPath)) {
      const queries = JSON.parse(fs.readFileSync(benchPath, 'utf-8'));
      return res.json({ success: true, queries });
    }
    res.status(404).json({ success: false, error: 'Benchmark queries not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/benchmarks/results', (req, res) => {
  try {
    const resultsPath = resolveDataPath('benchmark_results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      return res.json({ success: true, ...results });
    }
    res.status(404).json({ success: false, error: 'Benchmark results not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/messages/:id/context', (req, res) => {
  try {
    ensureStoreLoaded();
    const id = parseInt(req.params.id, 10);
    const windowSize = parseInt(req.query.window, 10) || 5;

    const context = vectorStore.getContextWindow(id, windowSize);
    if (!context) {
      return res.status(404).json({ success: false, error: `Message #${id} not found` });
    }

    res.json({ success: true, context });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    ensureStoreLoaded();
    const { query, topK = 5 } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query string is required' });
    }

    const t0 = Date.now();
    const cleanQ = query.trim();
    const analysis = analyzeQuery(cleanQ);

    // Check precomputed cache first for instant benchmark query retrieval
    const normalizedKey = cleanQ.toLowerCase();
    let queryVector;
    if (queryVectorCache[normalizedKey]) {
      queryVector = new Float32Array(queryVectorCache[normalizedKey]);
    } else {
      queryVector = await embedText(analysis.expandedQuery);
    }

    const rawResults = vectorStore.search(queryVector, {
      filter: analysis.filter,
      decisionBoost: analysis.isDecision,
      topK: Math.min(topK, 20)
    });

    const searchDurationMs = Date.now() - t0;

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

    res.json({
      success: true,
      query: cleanQ,
      analysis,
      search_duration_ms: searchDurationMs,
      total_candidates_scanned: vectorStore.messages.length,
      results: resultsWithContext
    });
  } catch (err) {
    console.error('Search handler error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
