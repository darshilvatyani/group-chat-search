import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeSearch } from '../src/engine/queryRouter.js';
import { vectorStore } from '../src/engine/vectorStore.js';
import { getExtractor } from '../src/engine/embeddingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBenchmark() {
  console.log('='.repeat(80));
  console.log('STARTING GROUP CHAT SEARCH BENCHMARK: 40 QUERIES EVALUATION');
  console.log('='.repeat(80));

  console.log('[1/3] Initializing vector store and embedding engine...');
  vectorStore.loadFromDisk();
  await getExtractor();
  console.log(`      Loaded ${vectorStore.messages.length} messages into index.`);

  const queriesPath = path.join(__dirname, '../data/benchmarkQueries.json');
  const queries = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));
  console.log(`[2/3] Loaded ${queries.length} benchmark queries.`);

  let top1HitsAll = 0;
  let top5HitsAll = 0;

  let top1HitsHard8 = 0;
  let top5HitsHard8 = 0;
  let countHard8 = 0;

  let top1HitsWarmup = 0;
  let top5HitsWarmup = 0;
  let countWarmup = 0;

  const categoryStats = {
    decision: { total: 0, top1: 0, top5: 0 },
    speaker: { total: 0, top1: 0, top5: 0 },
    temporal: { total: 0, top1: 0, top5: 0 }
  };

  const detailedResults = [];
  const latencies = [];

  console.log('\n[3/3] Evaluating queries...\n');

  for (const q of queries) {
    const t0 = Date.now();
    const searchRes = await executeSearch(q.query, { topK: 5 });
    const latency = Date.now() - t0;
    latencies.push(latency);

    const results = searchRes.results;
    const top1Match = results.length > 0 && results[0].id === q.target_id;
    const top5Match = results.some(r => r.id === q.target_id);

    const rank = results.findIndex(r => r.id === q.target_id) + 1; // 1 to 5, or 0 if not found

    if (top1Match) top1HitsAll++;
    if (top5Match) top5HitsAll++;

    // Track Category
    const cat = q.category || 'decision';
    if (categoryStats[cat]) {
      categoryStats[cat].total++;
      if (top1Match) categoryStats[cat].top1++;
      if (top5Match) categoryStats[cat].top5++;
    }

    if (q.is_zero_overlap) {
      countHard8++;
      if (top1Match) top1HitsHard8++;
      if (top5Match) top5HitsHard8++;
    } else {
      countWarmup++;
      if (top1Match) top1HitsWarmup++;
      if (top5Match) top5HitsWarmup++;
    }

    detailedResults.push({
      id: q.id,
      query: q.query,
      target_id: q.target_id,
      is_zero_overlap: q.is_zero_overlap,
      category: q.category,
      rank: rank > 0 ? rank : null,
      top1_hit: top1Match,
      top5_hit: top5Match,
      latency_ms: latency,
      top1_returned_id: results[0]?.id,
      top1_returned_text: results[0]?.text
    });

    const statusSymbol = top1Match ? '✓ Top-1' : top5Match ? `~ Rank ${rank}` : '✗ Miss';
    const tag = q.is_zero_overlap ? '[HARD-8]' : '[WARMUP]';
    console.log(
      `  #${String(q.id).padStart(2, '0')} ${tag.padEnd(8)} ${statusSymbol.padEnd(9)} (${latency}ms) "${q.query}"`
    );
  }

  const total = queries.length;
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);

  const recall1All = ((top1HitsAll / total) * 100).toFixed(1);
  const recall5All = ((top5HitsAll / total) * 100).toFixed(1);

  const recall1Hard8 = ((top1HitsHard8 / countHard8) * 100).toFixed(1);
  const recall5Hard8 = ((top5HitsHard8 / countHard8) * 100).toFixed(1);

  const recall1Warmup = ((top1HitsWarmup / countWarmup) * 100).toFixed(1);
  const recall5Warmup = ((top5HitsWarmup / countWarmup) * 100).toFixed(1);

  const gapRecall1 = (Number(recall1Warmup) - Number(recall1Hard8)).toFixed(1);
  const gapRecall5 = (Number(recall5Warmup) - Number(recall5Hard8)).toFixed(1);

  const summary = {
    total_queries: total,
    avg_latency_ms: Number(avgLatency),
    overall: {
      recall_at_1: `${recall1All}% (${top1HitsAll}/${total})`,
      recall_at_5: `${recall5All}% (${top5HitsAll}/${total})`
    },
    hard_8_zero_overlap: {
      count: countHard8,
      recall_at_1: `${recall1Hard8}% (${top1HitsHard8}/${countHard8})`,
      recall_at_5: `${recall5Hard8}% (${top5HitsHard8}/${countHard8})`
    },
    warmup_32: {
      count: countWarmup,
      recall_at_1: `${recall1Warmup}% (${top1HitsWarmup}/${countWarmup})`,
      recall_at_5: `${recall5Warmup}% (${top5HitsWarmup}/${countWarmup})`
    },
    accuracy_gap: {
      top1_gap: `${gapRecall1}%`,
      top5_gap: `${gapRecall5}%`,
      explanation: 'The drop in accuracy when vocabulary overlap drops to 0, representing the pure semantic boundary of embeddings.'
    },
    categories: categoryStats,
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.join(__dirname, '../data/benchmark_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({ summary, queries: detailedResults }, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log('BENCHMARK EVALUATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Overall Recall@1 (40 queries):  ${recall1All}%  (${top1HitsAll}/${total})`);
  console.log(`Overall Recall@5 (40 queries):  ${recall5All}%  (${top5HitsAll}/${total})`);
  console.log('-'.repeat(80));
  console.log(`Warmup 32 Recall@1:             ${recall1Warmup}% (${top1HitsWarmup}/${countWarmup})`);
  console.log(`Warmup 32 Recall@5:             ${recall5Warmup}% (${top5HitsWarmup}/${countWarmup})`);
  console.log('-'.repeat(80));
  console.log(`Hard-8 (Zero-Overlap) Recall@1: ${recall1Hard8}%  (${top1HitsHard8}/${countHard8})`);
  console.log(`Hard-8 (Zero-Overlap) Recall@5: ${recall5Hard8}%  (${top5HitsHard8}/${countHard8})`);
  console.log('-'.repeat(80));
  console.log(`THE ACCURACY GAP (Recall@1):    ${gapRecall1}% drop`);
  console.log(`THE ACCURACY GAP (Recall@5):    ${gapRecall5}% drop`);
  console.log(`Average Query Latency:          ${avgLatency} ms`);
  console.log('='.repeat(80));
  console.log(`Results saved to: ${resultsPath}`);
}

runBenchmark().catch(console.error);
