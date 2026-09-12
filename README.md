# Group Chat Semantic Search Engine

A context-aware semantic search engine built for messy real-world group chats featuring **code-mixed Hinglish, zero-word-overlap decision queries, participant filtering, and temporal expressions**.

## The Problem
Standard text search (Ctrl+F) fails when you remember the meaning of a conversation but not the exact wording:
- Query: *"When did we decide on Manali?"*
- Winning Message: *"bhai tickets ho gayi pack karlo sab"* (0 words in common).
- Searching for *"Manali"* returns 200 messages debating the destination, but misses the actual decision.

## System Architecture
1. **Context-Window Vectorization**: Short messages (`"haan"`, `"done"`, `"theek hai"`) are packed with their surrounding $\pm 2$ message conversational envelope.
2. **Multi-Strategy Query Router**: Directs questions to specialized handlers:
   - **Semantic / Decision**: Vector similarity over context-enriched embeddings.
   - **Speaker / Person**: Name extraction and hard boolean metadata filtering.
   - **Temporal Expressions**: Parsing relative dates (*"last month"*, *"in May"*) into timestamp ranges.
3. **Thread Context View**: Reconstructs $\pm 5$ messages around matches so the decision can be understood in context.

## Project Structure
- `server/`: Express API, query router, temporal parsing, and vector similarity engine.
- `client/`: React + Tailwind CSS chat interface with WhatsApp-style thread navigation.
