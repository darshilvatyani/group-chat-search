# ChatArchive — Context-Aware Semantic Search for Group Chats

> *"When did we decide on Manali? You know the message exists. It is somewhere in four thousand messages across six months, and you do not remember the words that were used. Someone probably typed 'chalo Manali fix hai', and searching for 'Manali' returns two hundred results. Text search fails at exactly the moment you need it, which is when you have forgotten the wording but remember the meaning."*

**ChatArchive** is a purpose-built semantic search engine designed specifically for the messy realities of group chats: **code-mixed Hinglish, zero-word-overlap decision queries, participant filtering, and relative temporal expressions**.

---

## 🚀 Live Production Deployment

👉 **Live Web App**: [https://group-chat-search.vercel.app](https://group-chat-search.vercel.app)

## 💻 Local Quickstart

### Prerequisites
- Node.js v18+ and npm installed

### 1. Install & Run
```bash
# Terminal 1: Start Express API & Vector Engine (Port 5001)
cd server && npm install && npm start

# Terminal 2: Start React Frontend (Port 3000)
cd client && npm install && npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

### 2. Run Automated Verification & Benchmarks
```bash
# Run mathematical zero-word-overlap verification
npm --prefix server run verify:benchmark

# Run the full 40-query benchmark evaluation
npm --prefix server run benchmark
```

---

## 🧠 Why Naive Search & Standard RAG Fail on Group Chats

1. **The Zero-Word-Overlap Dilemma**:
   - A user asks: *"When was the mountain vacation locked in?"*
   - The winning message is: *"bhai tickets ho gayi pack karlo sab"*
   - **Common vocabulary = Exactly 0 words**. Standard BM25 / keyword search returns zero results.
2. **The "Ripped Out of Context" Problem**:
   - 70% of group messages are terse fragments (*"done scene"*, *"theek hai"*, *"haan"*). Embedded in isolation, they are semantically meaningless.
   - The destination ("Manali") was debated 80 messages earlier, but the consensus message never mentions the word.
3. **The Multi-Shape Query Challenge**:
   - *"When did we decide on the trip?"* $\to$ Meaning & Consensus.
   - *"What did Priya say about the budget?"* $\to$ Person / Speaker entity filtering.
   - *"What did we discuss in February?"* $\to$ Relative temporal chronometry.
4. **Hinglish & Code-Mixing**:
   - Informal Indian chat archives mix English and Hindi freely (*"token amount transfer kar diya"*, *"pahadon me chalte hain"*). Standard English tokenizers fragment these into meaningless subwords.

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |   User Query Input    |
                                  +-----------+-----------+
                                              |
                                              v
                              +-------------------------------+
                              |    Intent & Query Router      |
                              |  (Speaker, Time, or Meaning)  |
                              +---------------+---------------+
                                              |
            +---------------------------------+--------------------------------+
            |                                 |                                |
            v                                 v                                v
  [ Semantic / Decision ]            [ Entity / Speaker ]             [ Temporal Window ]
  "When did we decide on..."         "What did Priya say..."         "Discussed in February"
            |                                 |                                |
            |                      Filter: `sender == 'Priya'`      Filter: `Feb 1 <= t <= Feb 29`
            v                                 v                                v
+-----------------------------------------------------------------------------------------------+
|                               Hybrid Context-Aware Retrieval                                  |
|  - In-Memory Vector Search over 4,200 Embeddings (384-dim, ONNX runtime)                     |
|  - Context-Window Representation: Message + (±2 surrounding messages envelope)                 |
|  - Cross-Lingual Hinglish Semantic Bridge ("mountain vacation" <-> "pahadon / Manali / trip")|
|  - Decision Consensus Weighting (boosts closure signals: "fix", "done", "transfer", "booked") |
+-----------------------------------------------+-----------------------------------------------+
                                                |
                                                v
                                +-------------------------------+
                                |  Context Thread Reconstruction|
                                |  - Anchors winning message ID |
                                |  - Reconstructs ±4 messages   |
                                |  - Highlights pivotal match   |
                                +---------------+---------------+
                                                |
                                                v
                                +-------------------------------+
                                |  Bespoke Editorial Light UI   |
                                |  - Real-time Router Telemetry |
                                |  - Benchmark Query Explorer   |
                                |  - In-App Accuracy Report     |
                                +-------------------------------+
```

---

## 📊 The Benchmark Suite & The Accuracy Gap

The project evaluates an index of **4,200 messages** across **6 months** (Jan – Jun 2024) with **8 participants** (*Aarav, Priya, Kabir, Rohan, Sneha, Ananya, Vikram, Neha*) against **40 labeled ground-truth queries**.

### Results Summary

| Benchmark Category | Queries | Recall@1 (Top-1 Hit) | Recall@5 (Top-5 Hit) | Mean Latency |
| :--- | :---: | :---: | :---: | :---: |
| **Warmup Queries (Lexical Overlap)** | 32 | **78.1%** (25/32) | **78.1%** (25/32) | 8.4 ms |
| **Hard-8 Queries (Zero-Word Overlap)** | 8 | **25.0%** (2/8) | **37.5%** (3/8) | 8.4 ms |
| **Overall Benchmark** | 40 | **67.5%** (27/40) | **70.0%** (28/40) | 8.4 ms |
| **THE ACCURACY GAP** | — | **-53.1%** | **-40.6%** | — |

> ### 💡 The Assignment's Core Finding
> *"The gap between those two numbers is the actual result of this project, and we would rather see an ugly gap reported than a pretty one hidden."*
>
> On the standard 32 warm-up queries, lexical and entity signals help the model achieve **78.1% top-1 accuracy**. When vocabulary overlap is strictly eliminated, accuracy drops to **25.0% - 37.5%**, exposing the precise boundary where dense vectors must rely purely on conversational thread context rather than lexical memorization.

---

## 🔬 The 8 Zero-Word-Overlap Challenge Queries

Every one of these 8 queries has mathematically **zero vocabulary words in common** with its target answer (verified via `npm run verify:benchmark`):

| # | User Query | Target Message | Target Sender | Common Words |
| :-: | :--- | :--- | :-: | :-: |
| **1** | *"When was the mountain vacation locked in?"* | *"bhai tickets ho gayi pack karlo sab"* | Aarav | **0** |
| **2** | *"Who paid the apartment security deposit advance?"* | *"token amount 25k transfer kar diya owner ko"* | Aarav | **0** |
| **3** | *"What did we conclude regarding Kabir's birthday gift?"* | *"sony headphones mangwa liye, splitwise pe hisab daal diya"* | Sneha | **0** |
| **4** | *"Did someone reserve our dinner table for Friday evening?"* | *"Bawarchi me 8 baje ka slot book kar diya maine"* | Sneha | **0** |
| **5** | *"Where should everyone submit their trip expenses?"* | *"group bana diya settle up wale app par sab enter kardo"* | Priya | **0** |
| **6** | *"What was decided about the rental lease duration?"* | *"owner bola 11 months ka standard stamp paper banega"* | Rohan | **0** |
| **7** | *"How will our crew travel to Himachal?"* | *"Kashmere Gate se sleeper volvo pakadni hai raat 9 baje"* | Vikram | **0** |
| **8** | *"Which audio headset model got purchased?"* | *"WH-1000XM5 black color wala card se swipe kiya tha"* | Aarav | **0** |

---

## 🛠️ Tech Stack & Engineering Decisions

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons. Designed with an editorial light-mode aesthetic (no generic "AI slop" purple gradients).
- **Backend API**: Node.js & Express with memory-mapped vector buffers.
- **Embedding Engine**: `@xenova/transformers` running `all-MiniLM-L6-v2` locally via ONNX runtime (384-dimensional normalized embeddings, 0 external API dependencies).
- **Temporal Parser**: `chrono-node` anchored to the corpus timeline (`2024-06-30`).
- **Vector Search**: Pure JavaScript vectorized cosine dot product scanning 4,200 embeddings in **< 10 milliseconds**.
