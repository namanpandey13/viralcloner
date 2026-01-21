'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Search, Zap, ArrowRight, Loader2, Sparkles, CheckSquare, Square, ChevronRight } from 'lucide-react';

// --- TYPES ---
interface Post {
  id: string;
  author: string;
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
  // State
  const [urls, setUrls] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection & Analysis State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // --- ACTIONS ---

  const addUrl = (url: string) => {
    // Basic validation
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
    setSelectedIds(new Set()); // Reset selection
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (e) {
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

  const handleBatchAnalyze = async () => {
    const idsToAnalyze = Array.from(selectedIds).filter(id => !analyses[id]);
    if (idsToAnalyze.length === 0) return;

    // Mark as processing
    const newProcessing = new Set(processingIds);
    idsToAnalyze.forEach(id => newProcessing.add(id));
    setProcessingIds(newProcessing);

    // Process sequentially to be nice to the API
    for (const id of idsToAnalyze) {
      const post = posts.find(p => p.id === id);
      if (!post) continue;

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: JSON.stringify({ text: post.text }),
        });
        const data = await res.json();
        setAnalyses(prev => ({ ...prev, [id]: data.analysis || data.error }));
      } catch (e) {
        console.error(e);
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 pb-32">
      
      {/* HEADER */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-black text-white p-1 rounded">
              <Zap size={16} fill="currentColor" />
            </div>
            Viral<span className="text-slate-400">Cloner</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* INPUT SECTION */}
        <div className="mb-12">
            <h1 className="text-3xl font-bold mb-6">Source Material</h1>
            
            <div className="flex gap-4 items-start">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 transition-all focus-within:ring-2 focus-within:ring-black/5 focus-within:border-slate-400">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {urls.map(url => (
                        <span key={url} className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                            {url.split('/in/')[1]?.replace('/', '') || url}
                            <button onClick={() => removeUrl(url)} className="hover:text-red-500"><X size={12} /></button>
                        </span>
                        ))}
                    </div>
                    <input 
                        className="w-full bg-transparent outline-none text-sm px-2 py-1 placeholder:text-slate-400"
                        placeholder="Paste LinkedIn URL and press Enter..."
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInputEnter()}
                    />
                </div>
                
                <button 
                    onClick={handleScrape}
                    disabled={loading || urls.length === 0}
                    className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 h-full"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                    Scan
                </button>
            </div>

            {/* PRESETS */}
            <div className="mt-4 flex gap-2">
                {PRESETS.map(p => (
                    <button 
                        key={p.name}
                        onClick={() => addUrl(p.url)} // Does not clear currentInput
                        className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-black transition-colors"
                    >
                        + {p.name}
                    </button>
                ))}
            </div>
        </div>

        {/* RESULTS TABLE (NOTION STYLE) */}
        {posts.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold">Results ({posts.length})</h2>
                <div className="text-xs text-slate-500">Select posts to generate blueprints</div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {/* TABLE HEADER */}
                <div className="grid grid-cols-[50px_100px_1fr_150px_100px] bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                    <div className="flex items-center justify-center">
                        {/* Select All could go here */}
                    </div>
                    <div>Score</div>
                    <div>Post Preview</div>
                    <div>Author</div>
                    <div className="text-right">Likes</div>
                </div>

                {/* TABLE BODY */}
                {posts.map((post) => {
                    const isSelected = selectedIds.has(post.id);
                    const hasAnalysis = !!analyses[post.id];
                    const isProcessing = processingIds.has(post.id);

                    return (
                        <div 
                            key={post.id}
                            onClick={() => toggleSelection(post.id)}
                            className={`
                                group grid grid-cols-[50px_100px_1fr_150px_100px] items-center py-4 px-4 border-b border-slate-100 last:border-0 cursor-pointer transition-colors
                                ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                            `}
                        >
                            {/* CHECKBOX */}
                            <div className="flex items-center justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(post.id); }}
                                    className={`text-slate-300 hover:text-blue-500 ${isSelected ? 'text-blue-600' : ''}`}
                                >
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                            </div>

                            {/* VIRAL SCORE */}
                            <div>
                                {post.isViral ? (
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-green-200">
                                        {post.multiplier}x
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                                        {post.multiplier}x
                                    </span>
                                )}
                            </div>

                            {/* PREVIEW */}
                            <div className="pr-8">
                                <p className="text-sm text-slate-700 font-medium line-clamp-1 truncate">{post.text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {isProcessing && <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Generating Blueprint...</span>}
                                    {hasAnalysis && !isProcessing && <span className="text-xs text-green-600 flex items-center gap-1"><Sparkles size={10}/> Blueprint Ready</span>}
                                </div>
                            </div>

                            {/* AUTHOR */}
                            <div className="text-sm text-slate-500 font-medium">{post.author}</div>

                            {/* LIKES & ARROW */}
                            <div className="text-right flex items-center justify-end gap-3">
                                <span className="text-sm font-mono text-slate-600">{post.likes.toLocaleString()}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setViewingPost(post); }}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-900"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        )}
      </main>

      {/* --- FLOATING ACTION BAR --- */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
            <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none"
            >
                <div className="bg-slate-900 text-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 pointer-events-auto">
                    <span className="font-medium text-sm">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button 
                        onClick={handleBatchAnalyze}
                        disabled={processingIds.size > 0}
                        className="font-bold text-sm flex items-center gap-2 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                        {processingIds.size > 0 ? <Loader2 className="animate-spin w-4 h-4"/> : <Zap className="w-4 h-4" fill="currentColor" />}
                        {processingIds.size > 0 ? "Processing..." : "Generate Blueprints"}
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- ANALYSIS DRAWER (READING MODE) --- */}
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-100 p-8"
            >
                <div className="flex justify-between items-start mb-8">
                    <h2 className="text-2xl font-bold">Blueprint</h2>
                    <button onClick={() => setViewingPost(null)}><X size={24} /></button>
                </div>

                {/* IF ANALYSIS EXISTS */}
                {analyses[viewingPost.id] ? (
                    <div className="prose prose-sm max-w-none">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                            <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                                <Sparkles size={16} /> Analysis
                            </h3>
                            <div className="whitespace-pre-wrap font-medium text-slate-800">
                                {analyses[viewingPost.id]}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-4">No blueprint generated yet.</p>
                        <button 
                            onClick={() => {
                                setSelectedIds(new Set([viewingPost.id]));
                                setViewingPost(null); // Close drawer to show action bar, or trigger manually
                                // Triggering manual single analysis for UX convenience
                                handleBatchAnalyze(); // This works because we rely on state, but we need to set selectedIds first
                            }} 
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Select this post to generate
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-slate-100">
                    <h3 className="font-bold text-slate-400 text-xs uppercase mb-2">Original Post</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{viewingPost.text}</p>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}