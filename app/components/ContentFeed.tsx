import { Loader2, CheckSquare, Square, ChevronRight, FileText, AlertCircle, Calendar, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface ContentFeedProps {
  posts: Post[];
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  setViewingPost: (post: Post) => void;
  analyses: Record<string, string>;
  processingIds: Set<string>;
}

export default function ContentFeed({ 
  posts, selectedIds, toggleSelection, toggleSelectAll, 
  setViewingPost, analyses, processingIds 
}: ContentFeedProps) {
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="grid grid-cols-[50px_70px_1fr_150px_80px] bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider py-4 px-4">
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

          // FALLBACK NAME LOGIC
          const displayName = post.author && post.author.trim() !== "" ? post.author : (post.handle || "LinkedIn User");

          return (
            <div 
              key={post.id}
              onClick={() => setViewingPost(post)} 
              className={`
                group grid grid-cols-[50px_70px_1fr_150px_80px] items-center py-4 px-4 transition-all cursor-pointer border-b border-slate-50 last:border-0
                ${isSelected ? 'bg-blue-50/40' : 'hover:bg-white hover:shadow-sm'}
              `}
            >
              {/* CHECKBOX */}
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
              <div className="pr-6">
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
              <div className="pr-2">
                <div className="text-sm text-slate-700 font-medium truncate flex items-center gap-2">
                   {/* If name is missing, show a generic icon so it's not empty */}
                   {displayName === "LinkedIn User" && <UserCircle size={14} className="text-slate-300"/>}
                   {displayName}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={10} />
                  {post.date ? post.date.split('T')[0] : "Recent"}
                </div>
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
  );
}