'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Microscope, Loader2, BarChart3, CheckSquare, Square, ChevronRight, AlertCircle, FileText } from 'lucide-react';

// --- TYPES ---
interface Post {
  id: string;
  author: string;
  handle?: string;
  date: string;
  likes: number;
  baseline: number;
  multiplier: number;
  isViral: boolean;
  text: string;
  url: string;
}

const PRESETS = [
  { name: "Justin Welsh", url: "https://www.linkedin.com/in/justinwelsh/" },
  { name: "Dan Koe", url: "https://www.linkedin.com/in/thedankoe/" },
  { name: "Sahil Bloom", url: "https://www.linkedin.com/in/sahilbloom/" },
];

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // --- ACTIONS ---

  const addUrl = (url: string) => {
    if (!url.trim()) return;
    if (urls.includes(url)) return;
    setUrls([...urls, url]);
  };

  const handleInputEnter = () => {
    addUrl(currentInput);
    setCurrentInput('');
  };

  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(u => u !== urlToRemove));
  };

  const handleScrape = async () => {
    if (urls.length === 0) return;
    setLoading(true);
    setPosts([]); 
    setSelectedIds(new Set()); 
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map(p => p.id)));
    }
  };

  const handleBatchAnalyze = async () => {
    const idsToAnalyze = Array.from(selectedIds).filter(id => !analyses[id]);
    if (idsToAnalyze.length === 0) return;

    const newProcessing = new Set(processingIds);
    idsToAnalyze.forEach(id => newProcessing.add(id));
    setProcessingIds(newProcessing);

    for (const id of idsToAnalyze) {
      const post = posts.find(p => p.id === id);
      if (!post) continue;

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: JSON.stringify({ text: post.text }),
        });
        const data = await res.json();
        const result = data.analysis || data.error || "Unknown error occurred";
        setAnalyses(prev => ({ ...prev, [id]: result }));
      } catch (e: any) {
        setAnalyses(prev => ({ ...prev, [id]: "Error: Failed to connect to API" }));
      } finally {
        setProcessingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-32">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <Microscope size={18} />
            </div>
            Content<span className="text-slate-400">Autopsy</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* INPUT SECTION */}
        <div className="mb-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">Analyze Profiles</h1>
            <p className="text-slate-500 mb-6">Enter LinkedIn URLs to scan for viral patterns.</p>
            
            <div className="flex gap-4 items-start">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 transition-all focus-within:ring-2 focus-within:ring-slate-900/5 focus-within:border-slate-400 min-h-[56px] flex items-center">
                    <div className="flex flex-wrap gap-2 w-full px-2">
                        {urls.map(url => (
                        <span key={url} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                            {url.split('/in/')[1]?.replace('/', '') || url}
                            <button onClick={() => removeUrl(url)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                        </span>
                        ))}
                        <input 
                            className="flex-1 bg-transparent outline-none text-sm px-1 py-1 placeholder:text-slate-400 min-w-[200px]"
                            placeholder={urls.length === 0 ? "Paste LinkedIn URL..." : "Add another..."}
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInputEnter()}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleScrape}
                    disabled={loading || urls.length === 0}
                    className="bg-slate-900 text-white px-8 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 h-[56px] transition-all shadow-md hover:shadow-lg"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                    Scan Content
                </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold uppercase text-slate-400 mr-2">Quick Add:</span>
                {PRESETS.map(p => (
                    <button 
                        key={p.name}
                        onClick={() => addUrl(p.url)}
                        className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:border-slate-900 hover:bg-white transition-all text-slate-600"
                    >
                        + {p.name}
                    </button>
                ))}
            </div>
        </div>

        {/* RESULTS TABLE */}
        {posts.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-xl font-bold">Content Feed ({posts.length})</h2>
                <div className="text-sm text-slate-500">Select posts to analyze patterns</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* HEADER */}
                <div className="grid grid-cols-[50px_80px_1fr_150px_100px] bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider py-4 px-4">
                    <div className="flex items-center justify-center">
                        <button onClick={toggleSelectAll} className="hover:text-blue-600 transition-colors">
                          {selectedIds.size === posts.length && posts.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                    </div>
                    <div className="pl-1">Impact</div>
                    <div>Post Preview</div>
                    <div>Creator</div>
                    <div className="text-right">Likes</div>
                </div>

                {/* BODY */}
                <div className="divide-y divide-slate-100">
                  {posts.map((post) => {
                      const isSelected = selectedIds.has(post.id);
                      const analysisText = analyses[post.id];
                      const isProcessing = processingIds.has(post.id);
                      const isReady = !!analysisText && !analysisText.toLowerCase().includes("error");
                      const isError = !!analysisText && analysisText.toLowerCase().includes("error");

                      return (
                          <div 
                              key={post.id}
                              onClick={() => setViewingPost(post)} // Clicking row opens breakdown
                              className={`
                                  group grid grid-cols-[50px_80px_1fr_150px_100px] items-center py-5 px-4 transition-all cursor-pointer
                                  ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'}
                              `}
                          >
                              {/* CHECKBOX (Stop Propagation so we can select without opening) */}
                              <div className="flex items-center justify-center">
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); toggleSelection(post.id); }}
                                      className={`text-slate-300 hover:text-blue-600 transition-colors ${isSelected ? 'text-blue-600' : ''}`}
                                  >
                                      {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                                  </button>
                              </div>

                              {/* SCORE */}
                              <div className="pl-1">
                                  {post.isViral ? (
                                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md border border-green-200 inline-flex items-center">
                                          {post.multiplier}x
                                      </span>
                                  ) : (
                                      <span className="text-slate-400 text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                          {post.multiplier}x
                                      </span>
                                  )}
                              </div>

                              {/* PREVIEW */}
                              <div className="pr-8">
                                  <p className="text-sm text-slate-700 font-medium line-clamp-1 truncate leading-relaxed group-hover:text-blue-600 transition-colors">
                                    {post.text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5 h-4">
                                      {isProcessing && <span className="text-xs text-blue-600 font-bold flex items-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin"/> Analyzing...</span>}
                                      {isReady && !isProcessing && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><FileText size={12}/> Analysis Ready</span>}
                                      {isError && <span className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> Analysis Failed</span>}
                                  </div>
                              </div>

                              {/* AUTHOR */}
                              <div className="text-sm text-slate-600 font-medium truncate pr-4">
                                {post.author || "Unknown"}
                              </div>

                              {/* LIKES */}
                              <div className="text-right flex items-center justify-end gap-3">
                                  <span className="text-sm font-mono text-slate-500 group-hover:text-slate-900 transition-colors">
                                    {post.likes.toLocaleString()}
                                  </span>
                                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                              </div>
                          </div>
                      );
                  })}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING ACTION BAR */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
            <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="fixed bottom-10 left-0 right-0 flex justify-center z-40 pointer-events-none"
            >
                <div className="bg-slate-900 text-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 pointer-events-auto ring-4 ring-slate-900/10">
                    <span className="font-medium text-sm pl-2">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button 
                        onClick={handleBatchAnalyze}
                        disabled={processingIds.size > 0}
                        className="font-bold text-sm flex items-center gap-2 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                        {processingIds.size > 0 ? <Loader2 className="animate-spin w-4 h-4"/> : <Microscope className="w-4 h-4" />}
                        {processingIds.size > 0 ? "Processing..." : "Deconstruct Posts"}
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* BREAKDOWN DRAWER */}
      <AnimatePresence>
        {viewingPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingPost(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 p-0"
            >
                {/* DRAWER HEADER */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Post Autopsy</h2>
                        <p className="text-sm text-slate-500">Breakdown of {viewingPost.author}'s content</p>
                    </div>
                    <button 
                        onClick={() => setViewingPost(null)} 
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {/* ERROR STATE */}
                    {analyses[viewingPost.id] && analyses[viewingPost.id].toLowerCase().includes("error") && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 text-red-600 text-sm">
                        <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={16}/> Analysis Failed</p>
                        <p>{analyses[viewingPost.id]}</p>
                    </div>
                    )}

                    {/* SUCCESS STATE */}
                    {analyses[viewingPost.id] && !analyses[viewingPost.id].toLowerCase().includes("error") ? (
                        <div className="prose prose-slate max-w-none">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 mb-8">
                                <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2 text-lg">
                                    <BarChart3 size={20} /> The Breakdown
                                </h3>
                                <div className="whitespace-pre-wrap font-medium text-slate-800 leading-relaxed">
                                    {analyses[viewingPost.id]}
                                </div>
                            </div>
                        </div>
                    ) : (
                    // EMPTY STATE
                    !analyses[viewingPost.id] && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-8">
                            <p className="text-slate-500 mb-4 font-medium">No analysis generated yet.</p>
                            <button 
                                onClick={() => {
                                    setSelectedIds(new Set([viewingPost.id]));
                                    setViewingPost(null); 
                                    handleBatchAnalyze();
                                }} 
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Deconstruct This Post
                            </button>
                        </div>
                    )
                    )}

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="font-bold text-slate-400 text-xs uppercase mb-4 tracking-wider">Original Content</h3>
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {viewingPost.text}
                        </div>
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}