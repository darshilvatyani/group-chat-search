import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { vectorStore } from './engine/vectorStore.js';
import { getExtractor } from './engine/embeddingEngine.js';
import { executeSearch } from './engine/queryRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Warm up vector store & embedding model on startup
let isInitialized = false;
async function initializeServer() {
  try {
    console.log('[server] Loading precomputed vector index into memory...');
    const count = vectorStore.loadFromDisk();
    console.log(`[server] Successfully loaded ${count} vectors into in-memory store.`);

    console.log('[server] Warming up transformer embedding pipeline...');
    await getExtractor();
    console.log('[server] Embedding pipeline ready for incoming queries.');
    isInitialized = true;
  } catch (err) {
    console.error('[server] Initialization failed:', err.message);
  }
}

// 1. Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    initialized: isInitialized,
    indexed_vectors: vectorStore.messages.length,
    timestamp: new Date().toISOString()
  });
});

// 2. Chat Stats Endpoint
app.get('/api/stats', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '../data/metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return res.json({ success: true, stats: meta });
    }
    res.json({
      success: true,
      stats: {
        total_messages: vectorStore.messages.length,
        isLoaded: vectorStore.isLoaded
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Benchmark Queries Endpoint (for UI quick-test triggers)
app.get('/api/benchmarks', (req, res) => {
  try {
    const benchPath = path.join(__dirname, '../data/benchmarkQueries.json');
    if (fs.existsSync(benchPath)) {
      const queries = JSON.parse(fs.readFileSync(benchPath, 'utf-8'));
      return res.json({ success: true, queries });
    }
    res.status(404).json({ success: false, error: 'Benchmark queries not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Context Window for specific message ID
app.get('/api/messages/:id/context', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const windowSize = parseInt(req.query.window, 10) || 5;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const context = vectorStore.getContextWindow(id, windowSize);
    if (!context) {
      return res.status(404).json({ success: false, error: `Message #${id} not found` });
    }

    res.json({ success: true, context });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// 6. Benchmark Results & Live Evaluation Endpoint
app.get("/api/benchmarks/results", (req, res) => {
  try {
    const resultsPath = path.join(__dirname, "../data/benchmark_results.json");
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
      return res.json({ success: true, ...results });
    }
    res.status(404).json({ success: false, error: "Benchmark results not yet generated. Run npm run benchmark first." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Main Semantic Search Endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query string is required' });
    }

    const response = await executeSearch(query.trim(), { topK: Math.min(topK, 20) });
    res.json({ success: true, ...response });
  } catch (err) {
    console.error('[server] Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Server listening on http://localhost:${PORT}`);
  });
});
