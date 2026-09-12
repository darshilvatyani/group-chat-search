import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)
  );
}

function verifyZeroOverlap() {
  const corpusPath = path.join(__dirname, '../data/chat_corpus.json');
  const queriesPath = path.join(__dirname, '../data/benchmarkQueries.json');

  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  const queries = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));

  const messageMap = new Map(corpus.map(m => [m.id, m]));

  console.log('='.repeat(80));
  console.log('BENCHMARK VERIFICATION: 40 QUERIES & HARD-8 ZERO-WORD-OVERLAP');
  console.log('='.repeat(80));

  let totalQueries = queries.length;
  let hard8Count = 0;
  let passedHard8 = 0;
  let errors = [];

  queries.forEach((q, idx) => {
    const target = messageMap.get(q.target_id);
    if (!target) {
      errors.push(`Query #${q.id}: Target message ID ${q.target_id} not found in corpus.`);
      return;
    }

    const qTokens = tokenize(q.query);
    const mTokens = tokenize(target.text);

    const overlap = [...qTokens].filter(word => mTokens.has(word));

    if (q.is_zero_overlap) {
      hard8Count++;
      if (overlap.length === 0) {
        passedHard8++;
        console.log(`[PASS] Hard-8 Query #${q.id}:`);
        console.log(`       Q: "${q.query}"`);
        console.log(`       A: [#${target.id}] ${target.sender}: "${target.text}"`);
        console.log(`       Overlap Words: [${overlap.join(', ')}] (Strictly 0 words)\n`);
      } else {
        errors.push(
          `FAIL Hard-8 Query #${q.id}: expected 0 overlap, found [${overlap.join(', ')}] between Q and A.`
        );
      }
    }
  });

  console.log('='.repeat(80));
  console.log(`Total Queries Checked: ${totalQueries}`);
  console.log(`Hard-8 Zero-Overlap Checked: ${hard8Count}`);
  console.log(`Hard-8 Zero-Overlap Passed:  ${passedHard8} / ${hard8Count}`);

  if (errors.length > 0) {
    console.error('\nERRORS FOUND:');
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('\nSUCCESS: All 8 hard queries have strictly ZERO overlapping words with target messages!');
    console.log('All 40 benchmark query targets are validated against the corpus.');
    console.log('='.repeat(80));
  }
}

verifyZeroOverlap();
