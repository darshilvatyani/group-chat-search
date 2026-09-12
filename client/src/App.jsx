import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  User,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageSquare,
  BarChart3,
  X,
  TrendingDown
} from 'lucide-react';

const PARTICIPANT_COLORS = {
  Aarav: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  Priya: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  Kabir: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
  Rohan: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  Sneha: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Ananya: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
  Vikram: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Neha: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' }
};

export default function App() {
  const [query, setQuery] = useState('');
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState(null);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hard8'); // 'hard8', 'speaker', 'temporal', 'decision'
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [stats, setStats] = useState(null);
  const targetRef = useRef(null);

  // Load benchmarks and stats on mount
  useEffect(() => {
    fetch('/api/benchmarks')
      .then(res => res.json())
      .then(data => {
        if (data.success) setBenchmarks(data.queries);
      })
      .catch(console.error);

    fetch('/api/benchmarks/results')
      .then(res => res.json())
      .then(data => {
        if (data.success) setBenchmarkSummary(data.summary);
      })
      .catch(console.error);

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(console.error);
  }, []);

  // Run search
  const handleSearch = async (queryToRun) => {
    const q = queryToRun || query;
    if (!q || !q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), topK: 5 })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResponse(data);
        setSelectedResultIndex(0);
        setTimeout(() => {
          targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerBenchmark = (benchmarkQuery) => {
    setQuery(benchmarkQuery.query);
    handleSearch(benchmarkQuery.query);
  };

  const hard8Queries = benchmarks.filter(b => b.is_zero_overlap);
  const speakerQueries = benchmarks.filter(b => b.category === 'speaker');
  const temporalQueries = benchmarks.filter(b => b.category === 'temporal');
  const decisionQueries = benchmarks.filter(b => b.category === 'decision' && !b.is_zero_overlap);

  const currentResult = searchResponse?.results?.[selectedResultIndex];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafaf9] text-stone-900">
      {/* 1. LEFT SIDEBAR: Benchmark & Query Explorer */}
      <aside className="flex w-96 flex-col border-r border-stone-200 bg-white shadow-sm">
        {/* Header Branding */}
        <div className="border-b border-stone-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-stone-900">ChatArchive</h1>
                <p className="text-xs font-medium text-stone-500">Context-Aware Group Search</p>
              </div>
            </div>

            {/* Benchmark Report Modal Trigger Button */}
            <button
              onClick={() => setShowBenchmarkModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100 transition-colors"
              title="View 40-query accuracy report"
            >
              <BarChart3 className="h-3.5 w-3.5 text-amber-700" />
              <span>Report</span>
            </button>
          </div>

          {/* Dataset Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-mono text-stone-600">
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">4,200 msgs</span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">8 members</span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">Jan – Jun 2024</span>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 p-1.5 text-xs font-semibold text-stone-600">
          <button
            onClick={() => setActiveTab('hard8')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'hard8' ? 'bg-white text-amber-700 shadow-sm' : 'hover:text-stone-900'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span>Hard 8</span>
          </button>
          <button
            onClick={() => setActiveTab('speaker')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'speaker' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:text-stone-900'
            }`}
          >
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <span>Person</span>
          </button>
          <button
            onClick={() => setActiveTab('temporal')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'temporal' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-stone-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Time</span>
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'decision' ? 'bg-white text-teal-700 shadow-sm' : 'hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
            <span>Decision</span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'hard8' && (
            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                <span>Zero-Word-Overlap Benchmarks</span>
                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">8 queries</span>
              </div>
              <p className="mb-3 px-1 text-xs text-stone-500 leading-relaxed">
                Queries sharing <strong>0 vocabulary words</strong> with their answer. Vector context & Hinglish bridging are mandatory here.
              </p>
              <div className="space-y-2">
                {hard8Queries.map(bq => (
                  <button
                    key={bq.id}
                    onClick={() => triggerBenchmark(bq)}
                    className="w-full text-left rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:border-amber-300 hover:bg-amber-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                      <span>Query #{bq.id}</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <Zap className="h-3 w-3" /> 0 word overlap
                      </span>
                    </div>
                    <div className="text-xs font-medium text-stone-800 group-hover:text-amber-900">
                      "{bq.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'speaker' && (
            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-800">
                Person / Speaker Queries
              </div>
              <p className="mb-3 px-1 text-xs text-stone-500">
                Questions targeting what specific participants said, evaluated via entity router filtering.
              </p>
              <div className="space-y-2">
                {speakerQueries.slice(0, 10).map(bq => (
                  <button
                    key={bq.id}
                    onClick={() => triggerBenchmark(bq)}
                    className="w-full text-left rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                      <span>Query #{bq.id}</span>
                      <span className="text-indigo-600 font-medium">Speaker Filter</span>
                    </div>
                    <div className="text-xs font-medium text-stone-800 group-hover:text-indigo-900">
                      "{bq.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'temporal' && (
            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Temporal Expressions
              </div>
              <p className="mb-3 px-1 text-xs text-stone-500">
                Questions with chronological filters mapped to exact calendar ranges via Chrono engine.
              </p>
              <div className="space-y-2">
                {temporalQueries.map(bq => (
                  <button
                    key={bq.id}
                    onClick={() => triggerBenchmark(bq)}
                    className="w-full text-left rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                      <span>Query #{bq.id}</span>
                      <span className="text-emerald-600 font-medium">Time Window</span>
                    </div>
                    <div className="text-xs font-medium text-stone-800 group-hover:text-emerald-900">
                      "{bq.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'decision' && (
            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                Decision & Consensus Queries
              </div>
              <p className="mb-3 px-1 text-xs text-stone-500">
                Retrieves pivotal confirmation moments out of lengthy group deliberations.
              </p>
              <div className="space-y-2">
                {decisionQueries.map(bq => (
                  <button
                    key={bq.id}
                    onClick={() => triggerBenchmark(bq)}
                    className="w-full text-left rounded-lg border border-stone-200 bg-white p-3 shadow-sm hover:border-teal-300 hover:bg-teal-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                      <span>Query #{bq.id}</span>
                      <span className="text-teal-600 font-medium">Consensus</span>
                    </div>
                    <div className="text-xs font-medium text-stone-800 group-hover:text-teal-900">
                      "{bq.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE: Search Omnibox, Query Router Inspector & Thread Window */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Omnibox Search Bar */}
        <div className="border-b border-stone-200 bg-white px-8 py-4 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about a decision, person, or time (e.g. 'When did we decide on Manali?')..."
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 py-3 pl-10 pr-24 text-sm font-medium text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setQuery('')}
                className={`absolute right-14 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 hover:text-stone-700 ${
                  query ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                Clear
              </button>
              <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-400 shadow-sm">
                ↵ Enter
              </kbd>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Search Archive</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Query Router & Engine Inspector (Live Feedback) */}
          {searchResponse && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
              <span className="font-mono text-[11px] uppercase font-bold tracking-wide text-stone-400">
                Engine Router:
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 font-medium text-stone-800 border border-stone-200">
                Type: <strong className="capitalize">{searchResponse.analysis.queryType}</strong>
              </span>
              {searchResponse.analysis.filter.sender && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700 border border-indigo-200">
                  Filter: Sender == <strong>{searchResponse.analysis.filter.sender}</strong>
                </span>
              )}
              {searchResponse.analysis.temporalMeta && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700 border border-emerald-200">
                  Calendar Window: {searchResponse.analysis.temporalMeta.matched}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-800 border border-amber-200">
                Cross-Lingual Bridge: <span className="font-mono text-[10px]">{searchResponse.analysis.expandedQuery.slice(0, 45)}...</span>
              </span>
              <span className="ml-auto font-mono text-[11px] text-stone-400">
                Retrieved in <strong>{searchResponse.search_duration_ms}ms</strong> across 4,200 vectors
              </span>
            </div>
          )}
        </div>

        {/* Results Stream Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!searchResponse ? (
            /* Empty State / Welcome Canvas */
            <div className="flex h-full flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-stone-900">Search with Meaning, Not Just Keywords</h2>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Standard keyword search (Ctrl+F) fails when you remember what happened, but not the exact wording.
                  In group chats, the decision is often terse (*"chalo done"*, *"tickets ho gayi"*) while the debate was 100 messages earlier.
                </p>
                <div className="mt-6 border-t border-stone-100 pt-4 text-xs text-stone-500">
                  Click any benchmark in the left sidebar to test a live query, or type any phrase above.
                </div>
              </div>
            </div>
          ) : (
            /* Active Results & Thread View */
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Match Selection Switcher */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Top Ranked Results ({searchResponse.results.length})
                </div>
                <div className="flex gap-1.5">
                  {searchResponse.results.map((r, idx) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedResultIndex(idx)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                        selectedResultIndex === idx
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      #{idx + 1} ({r.sender})
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread Context Window View (Solving the "Ripped out of context" problem) */}
              {currentResult && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                  {/* Context Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                        Conversation Neighborhood (±4 messages)
                      </span>
                      <h3 className="text-sm font-bold text-stone-800">
                        Thread Surrounding Target #{currentResult.id}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-800 border border-amber-200">
                        Similarity Score: {currentResult.score.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="space-y-3 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {currentResult.context_window?.map((msg) => {
                      const isTarget = msg.is_target;
                      const senderStyle = PARTICIPANT_COLORS[msg.sender] || {
                        bg: 'bg-stone-50',
                        text: 'text-stone-700',
                        border: 'border-stone-200',
                        dot: 'bg-stone-400'
                      };

                      const formattedDate = new Date(msg.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={msg.id}
                          ref={isTarget ? targetRef : null}
                          className={`relative rounded-xl transition-all p-3.5 ${
                            isTarget
                              ? 'bg-amber-50/90 border-2 border-amber-400 shadow-sm ring-4 ring-amber-100'
                              : 'bg-stone-50/70 border border-stone-200/80 hover:bg-stone-50'
                          }`}
                        >
                          {/* Target Highlight Badge */}
                          {isTarget && (
                            <div className="mb-2 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                                🎯 Exact Target Match
                              </span>
                              <span className="text-[11px] font-mono text-amber-800">
                                Message ID #{msg.id}
                              </span>
                            </div>
                          )}

                          {/* Message Header: Sender & Time */}
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${senderStyle.dot}`} />
                              <span className={`font-semibold ${senderStyle.text}`}>
                                {msg.sender}
                              </span>
                              {msg.is_decision && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                                  ✓ Decision
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-stone-400">
                              {formattedDate}
                            </span>
                          </div>

                          {/* Message Content */}
                          <div className={`text-sm leading-relaxed ${isTarget ? 'font-medium text-stone-950' : 'text-stone-700'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. BENCHMARK ACCURACY REPORT MODAL */}
      {showBenchmarkModal && benchmarkSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">Benchmark Evaluation Report</h2>
                  <p className="text-xs text-stone-500">40 Labeled Queries across 4,200 Group Messages</p>
                </div>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Score Grid Cards */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                <span className="text-xs font-medium text-stone-500">Warmup 32 Recall@1</span>
                <div className="mt-1 text-2xl font-bold text-stone-900">{benchmarkSummary.warmup_32.recall_at_1}</div>
                <span className="text-[11px] text-stone-400">Vocabulary overlap present</span>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <span className="text-xs font-semibold text-amber-800">Hard-8 Recall@1</span>
                <div className="mt-1 text-2xl font-bold text-amber-950">{benchmarkSummary.hard_8_zero_overlap.recall_at_1}</div>
                <span className="text-[11px] text-amber-700">Strictly 0 word overlap</span>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                <span className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5" /> Accuracy Gap
                </span>
                <div className="mt-1 text-2xl font-bold text-rose-950">{benchmarkSummary.accuracy_gap.top1_gap}</div>
                <span className="text-[11px] text-rose-700">Pure semantic drop</span>
              </div>
            </div>

            {/* Philosophical Callout Quote from Assignment */}
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700 leading-relaxed">
              <p className="font-semibold text-stone-900 mb-1">💡 The Core Finding of this Project:</p>
              <p className="italic text-stone-600">
                "The gap between those two numbers is the actual result of this project, and we would rather see an ugly gap reported than a pretty one hidden."
              </p>
              <p className="mt-2 text-[11px] text-stone-500">
                Standard queries achieve <strong>{benchmarkSummary.warmup_32.recall_at_1}</strong> because lexicons align. When vocabulary overlap drops to 0, accuracy falls to <strong>{benchmarkSummary.hard_8_zero_overlap.recall_at_1}</strong>, exposing the exact boundary where dense vector representation relies entirely on conversational thread envelopes.
              </p>
            </div>

            {/* Metrics Breakdown Table */}
            <div className="mt-4 border-t border-stone-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Retrieval Performance Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between rounded-lg bg-stone-100/70 px-3 py-2">
                  <span className="text-stone-600">Overall Recall@1 (40 queries):</span>
                  <span className="font-bold text-stone-900">{benchmarkSummary.overall.recall_at_1}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-stone-100/70 px-3 py-2">
                  <span className="text-stone-600">Overall Recall@5 (40 queries):</span>
                  <span className="font-bold text-stone-900">{benchmarkSummary.overall.recall_at_5}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-stone-100/70 px-3 py-2">
                  <span className="text-stone-600">Average Query Latency:</span>
                  <span className="font-bold text-stone-900">{benchmarkSummary.avg_latency_ms} ms</span>
                </div>
                <div className="flex justify-between rounded-lg bg-stone-100/70 px-3 py-2">
                  <span className="text-stone-600">Index Scale:</span>
                  <span className="font-bold text-stone-900">{benchmarkSummary.total_queries} queries / 4,200 msgs</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
