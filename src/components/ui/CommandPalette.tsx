import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Database, LayoutTemplate, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 py-3 border-b border-slate-800">
            <Search className="w-5 h-5 text-slate-500 mr-3" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-lg"
              placeholder="What do you want to build? (e.g., 'Create Users table')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs font-mono">ESC</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggestions</p>
            <div className="space-y-1">
              <button onClick={() => { setIsOpen(false); navigate('/app/designer'); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-300 text-slate-300 transition-colors text-left group">
                <Database className="w-4 h-4 group-hover:text-emerald-400 text-slate-500" />
                <span className="flex-1">Create new Database Table</span>
              </button>
              <button onClick={() => { setIsOpen(false); navigate('/app/setup'); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-green-500/10 hover:text-green-300 text-slate-300 transition-colors text-left group">
                <LayoutTemplate className="w-4 h-4 group-hover:text-green-400 text-slate-500" />
                <span className="flex-1">Start Socratic Project Wizard</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-300 text-slate-300 transition-colors text-left group">
                <Zap className="w-4 h-4 group-hover:text-rose-400 text-slate-500" />
                <span className="flex-1">Run Big O Query Visualizer</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
