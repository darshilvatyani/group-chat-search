import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { packMessageContext } from '../src/engine/contextPacker.js';
import { embedBatch } from '../src/engine/embeddingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runIndex() {
  console.log('='.repeat(80));
  console.log('INDEXING CORPUS: Context Window Packing & Vector Embeddings');
  console.log('='.repeat(80));

  const corpusPath = path.join(__dirname, '../data/chat_corpus.json');
  const enrichedPath = path.join(__dirname, '../data/enriched_corpus.json');
  const binPath = path.join(__dirname, '../data/embeddings.bin');

  const rawMessages = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  console.log(`[1/4] Loaded ${rawMessages.length} raw messages from ${corpusPath}`);

  console.log('[2/4] Packing conversational context (±2 messages envelope)...');
  const enrichedMessages = packMessageContext(rawMessages);
  fs.writeFileSync(enrichedPath, JSON.stringify(enrichedMessages, null, 2), 'utf-8');
  console.log(`      Saved enriched corpus to ${enrichedPath}`);

  console.log('[3/4] Generating 384-dim semantic embeddings via ONNX runtime...');
  const t0 = Date.now();
  const textsToEmbed = enrichedMessages.map(m => m.enriched_text);

  const vectors = await embedBatch(textsToEmbed, 32, (done, total) => {
    process.stdout.write(`\r      Progress: ${done} / ${total} messages embedded (${((done / total) * 100).toFixed(1)}%)...`);
  });
  console.log('');
  const dtSeconds = (Date.now() - t0) / 1000;
  console.log(`      Embedding complete in ${dtSeconds.toFixed(2)}s (${(textsToEmbed.length / dtSeconds).toFixed(1)} emb/s)`);

  console.log('[4/4] Serializing embeddings to binary format...');
  const dim = vectors[0].length;
  const buffer = Buffer.alloc(vectors.length * dim * 4); // 4 bytes per float32

  for (let i = 0; i < vectors.length; i++) {
    const vec = vectors[i];
    for (let d = 0; d < dim; d++) {
      buffer.writeFloatLE(vec[d], (i * dim + d) * 4);
    }
  }

  fs.writeFileSync(binPath, buffer);
  console.log(`      Saved ${vectors.length} vectors (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) to ${binPath}`);
  console.log('='.repeat(80));
  console.log('INDEXING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(80));
}

runIndex().catch(err => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
