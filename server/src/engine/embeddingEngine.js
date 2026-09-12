import { pipeline } from '@xenova/transformers';

let extractorPromise = null;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

export async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_NAME);
  }
  return extractorPromise;
}

export async function embedText(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return new Float32Array(output.data);
}

export async function embedBatch(texts, batchSize = 32, onProgress = null) {
  const extractor = await getExtractor();
  const total = texts.length;
  const vectors = [];

  for (let i = 0; i < total; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const chunkOutputs = await Promise.all(
      chunk.map(t => extractor(t, { pooling: 'mean', normalize: true }))
    );

    for (const out of chunkOutputs) {
      vectors.push(new Float32Array(out.data));
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
  }

  return vectors;
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}
