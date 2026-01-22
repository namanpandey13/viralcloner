import { X, AlertCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutopsyDrawerProps {
  post: any | null;
  onClose: () => void;
  analysis: string | null;
  onGenerate: () => void;
}

export default function AutopsyDrawer({ post, onClose, analysis, onGenerate }: AutopsyDrawerProps) {
  if (!post) return null;

  const isError = analysis && analysis.toLowerCase().includes("error");

  return (
    <AnimatePresence>
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
        />
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 p-0"
        >
          {/* HEADER */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Post Autopsy</h2>
              <p className="text-sm text-slate-500">Breakdown of content by {post.author || "User"}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            {/* ERROR STATE */}
            {isError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 text-red-600 text-sm">
                <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={16}/> Analysis Failed</p>
                <p>{analysis}</p>
              </div>
            )}

            {/* SUCCESS STATE */}
            {analysis && !isError ? (
              <div className="prose prose-slate max-w-none">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 mb-8">
                  <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2 text-lg">
                    <BarChart3 size={20} /> The Breakdown
                  </h3>
                  <div className="whitespace-pre-wrap font-medium text-slate-800 leading-relaxed">
                    {analysis}
                  </div>
                </div>
              </div>
            ) : (
              // EMPTY STATE
              !analysis && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-8">
                  <p className="text-slate-500 mb-4 font-medium">No analysis generated yet.</p>
                  <button 
                    onClick={onGenerate}
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
                {post.text}
              </div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}