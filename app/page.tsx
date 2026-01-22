'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Microscope, Loader2 } from 'lucide-react';

// --- FIX: USE RELATIVE PATHS ---
import ContentFeed from './components/ContentFeed';
import AutopsyDrawer from './components/AutopsyDrawer';

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
        {/* INPUT */}
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

        {/* FEED */}
        {posts.length > 0 && (
          <ContentFeed 
            posts={posts}
            selectedIds={selectedIds}
            toggleSelection={toggleSelection}
            toggleSelectAll={toggleSelectAll}
            setViewingPost={setViewingPost}
            analyses={analyses}
            processingIds={processingIds}
          />
        )}
      </main>

      {/* FLOATING BAR */}
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

      {/* DRAWER */}
      {viewingPost && (
        <AutopsyDrawer 
          post={viewingPost}
          onClose={() => setViewingPost(null)}
          analysis={analyses[viewingPost.id]}
          onGenerate={() => {
             setSelectedIds(new Set([viewingPost.id]));
             setViewingPost(null); 
             handleBatchAnalyze();
          }}
        />
      )}
    </div>
  );
}
