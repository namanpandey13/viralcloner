import { Loader2, CheckSquare, Square, FileText, AlertCircle, ThumbsUp } from 'lucide-react';

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
      {/* HEADER: Adjusted for 3 columns [Checkbox | Metrics | Content] */}
      <div className="grid grid-cols-[50px_140px_1fr] bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider py-4 px-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-start justify-center">
          <button onClick={toggleSelectAll} className="hover:text-blue-600 transition-colors">
            {selectedIds.size === posts.length && posts.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>
        </div>
        <div className="pl-1">Performance</div>
        <div>Full Post Content</div>
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
              onClick={() => setViewingPost(post)} 
              className={`
                group grid grid-cols-[50px_140px_1fr] items-start py-6 px-4 transition-all cursor-pointer border-b border-slate-50 last:border-0
                ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'}
              `}
            >
              {/* COL 1: CHECKBOX */}
              <div className="flex items-start justify-center pt-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSelection(post.id); }}
                  className={`text-slate-300 hover:text-blue-600 transition-colors ${isSelected ? 'text-blue-600' : ''}`}
                >
                  {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>
              </div>

              {/* COL 2: METRICS (Stacked) */}
              <div className="flex flex-col gap-2 pr-4 pt-0.5">
                {/* Viral Score */}
                <div>
                  {post.isViral ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200 inline-flex items-center shadow-sm">
                      {post.multiplier}x Impact
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                      {post.multiplier}x Base
                    </span>
                  )}
                </div>
                
                {/* Likes */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                   <ThumbsUp size={12} />
                   {post.likes.toLocaleString()}
                </div>

                {/* Status Badges */}
                <div className="mt-2">
                  {isProcessing && <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 animate-pulse"><Loader2 size={10} className="animate-spin"/> Analyzing</span>}
                  {isReady && !isProcessing && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><FileText size={10}/> Ready</span>}
                  {isError && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> Failed</span>}
                </div>
              </div>

              {/* COL 3: FULL CONTENT (No Truncation) */}
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {post.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
