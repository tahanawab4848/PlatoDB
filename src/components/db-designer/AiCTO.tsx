import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, X, Zap, ChevronDown, ChevronUp, Cpu, CheckCircle2, BookOpen } from "lucide-react";
import { useStore } from "../../store/useStore";

interface CTOWarning {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
  suggestion: string;
  action: string;
  affectedTable: string | null;
  topic?: string;
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", dot: "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" },
};

export default function AiCTO() {
  const { tables, relations, setTables, setRelations } = useStore();
  const [warnings, setWarnings] = useState<CTOWarning[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [activeMentorSession, setActiveMentorSession] = useState<CTOWarning | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTablesHash = useRef<string>("");

  const analyze = useCallback(async (currentTables: typeof tables) => {
    if (currentTables.length === 0) return;
    setIsWatching(true);
    try {
      const res = await fetch("/api/cto-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: currentTables, relations }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.warnings) {
        setWarnings(data.warnings.filter((w: CTOWarning) => !dismissed.has(w.id)));
      }
    } catch {
      // Backend offline — silent
    } finally {
      setIsWatching(false);
    }
  }, [relations, dismissed]);

  // Debounced schema watcher
  useEffect(() => {
    const hash = JSON.stringify(tables.map(t => ({ id: t.id, cols: t.columns.length })));
    if (hash === prevTablesHash.current) return;
    prevTablesHash.current = hash;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      analyze(tables);
    }, 4000); // Wait 4s after last change

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [tables, analyze]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    setWarnings(prev => prev.filter(w => w.id !== id));
  };

  const applyFix = async (warning: CTOWarning) => {
    if (warning.action === "none") { dismiss(warning.id); return; }
    setFixing(warning.id);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: warning.action, selectedTableId: null, tables, relations, userMessage: warning.suggestion }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.tables) { setTables(data.tables); setRelations(data.relations || relations); }
      dismiss(warning.id);
    } catch {
      dismiss(warning.id);
    } finally {
      setFixing(null);
    }
  };

  const activeWarnings = warnings.filter(w => !dismissed.has(w.id));

  const topSeverity = activeWarnings.find(w => w.severity === "error") ? "error"
    : activeWarnings.find(w => w.severity === "warning") ? "warning" : "info";
  const config = SEVERITY_CONFIG[topSeverity];

  return (
    <div className={`relative w-full z-40 shrink-0 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 transition-all duration-300 ease-in-out ${isExpanded ? "h-64" : "h-10"}`}>
      
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between px-4 h-10 cursor-pointer hover:bg-slate-800/30 transition-colors border-b border-slate-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Socratic CTO Issues</span>
          </div>
          
          <div className="w-px h-4 bg-slate-800 mx-1" />
          
          {activeWarnings.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {activeWarnings.length} Issues
              </span>
              <span className="text-[10px] text-slate-500">
                Found architectural flaws
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">No issues</span>
            </div>
          )}

          {isWatching && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 animate-pulse">Analyzing...</span>
            </div>
          )}
        </div>
        
        <button className="text-slate-500 hover:text-white transition-colors">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="p-4 h-[calc(100%-2.5rem)] overflow-y-auto"
          >
            {activeWarnings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <CheckCircle2 className="w-8 h-8 mb-3 text-emerald-500/30" />
                <p className="text-sm font-medium text-slate-400">Your architecture looks solid.</p>
                <p className="text-xs text-slate-500 mt-1">The CTO Watchdog is monitoring for bottlenecks.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {activeWarnings.map(w => {
                  const cfg = SEVERITY_CONFIG[w.severity];
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={w.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={`rounded-xl border p-4 ${cfg.bg} bg-slate-900/50 shadow-sm relative group`}>
                      <button onClick={() => dismiss(w.id)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-xs font-bold mb-1.5 ${cfg.color}`}>{w.title}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{w.message}</p>
                          
                          {w.affectedTable && (
                            <div className="text-[10px] font-mono text-slate-500 mb-3 bg-slate-950/50 inline-block px-2 py-1 rounded">
                              Table: <span className="text-emerald-400">{w.affectedTable}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {w.action !== "none" && (
                              <button onClick={() => setActiveMentorSession(w)} disabled={fixing === w.id}
                                className={`flex items-center gap-2 text-[11px] font-bold px-4 py-2 rounded-lg border transition-all hover:bg-white/5 hover:scale-105 shadow-lg ${cfg.bg} ${cfg.color}`}>
                                {fixing === w.id ? <span className="w-4 h-4 border border-current rounded-full border-t-transparent animate-spin" /> : <Info className="w-4 h-4" />}
                                Learn & Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMentorSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
               className="w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[90vh]">
               
               {/* Header */}
               <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-emerald-500/5 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                     <BookOpen className="w-4 h-4 text-emerald-400" />
                   </div>
                   <h2 className="text-lg font-bold text-slate-100">Mandatory Mentorship Session</h2>
                 </div>
                 <button onClick={() => setActiveMentorSession(null)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
               </div>

               {/* Body (Scrollable) */}
               <div className="p-6 overflow-y-auto flex-1 min-h-0">
                 
                 {/* The Issue */}
                 <div className="mb-8">
                   <p className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">The Flaw</p>
                   <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                     <strong className="text-slate-100">{activeMentorSession.title}:</strong> {activeMentorSession.message}
                   </div>
                 </div>

                 {/* The Theory / Lesson */}
                 <div className="mb-8">
                   <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">The Theory</p>
                   
                   {activeMentorSession.topic === "indexing" && (
                     <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                       <h3 className="text-base font-bold text-white mb-2">Why B-Tree Indexes Matter</h3>
                       <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                         When you query a column without an index, the database engine must perform a "Sequential Scan"—literally checking every single row one by one. At 1 million rows, that's 1 million checks. By applying an index, the database builds a B-Tree data structure, reducing the search complexity exponentially.
                       </p>
                       <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                         <div className="flex flex-col gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                           <span className="text-rose-400 font-bold">No Index (Table Scan)</span>
                           <span className="text-slate-300">Time Complexity: O(N)</span>
                         </div>
                         <div className="flex flex-col gap-2 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                           <span className="text-emerald-400 font-bold">With Index (B-Tree)</span>
                           <span className="text-slate-300">Time Complexity: O(log N)</span>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeMentorSession.topic === "normalization" && (
                     <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                       <h3 className="text-base font-bold text-white mb-2">3rd Normal Form (3NF) & Anomalies</h3>
                       <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                         Storing redundant fields directly in primary tables (like writing "New York" 50,000 times) causes "Update Anomalies". If the city changes its name, you must execute 50,000 updates instead of 1. By normalizing, we rely on relational references.
                       </p>
                       <div className="flex gap-4 text-xs">
                         <div className="flex-1 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                           <span className="text-rose-400 font-bold block mb-2">Bad (1NF)</span>
                           <div className="text-slate-300">Users [name, city, country]</div>
                         </div>
                         <div className="flex-1 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                           <span className="text-emerald-400 font-bold block mb-2">Good (3NF)</span>
                           <div className="text-slate-300">Users [name, location_id]</div>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {(!activeMentorSession.topic || (activeMentorSession.topic !== "indexing" && activeMentorSession.topic !== "normalization")) && (
                     <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                       <p className="text-sm text-slate-400 leading-relaxed">
                         The AI CTO flagged this pattern because it commonly leads to scalability bottlenecks in distributed systems. Correcting structural flaws early prevents massive technical debt later in production. Read the warning carefully to understand the tradeoff.
                       </p>
                     </div>
                   )}
                 </div>

                 {/* The Quiz */}
                 <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Prove Your Understanding to Apply Fix</p>
                   <div className="space-y-3">
                     <button onClick={() => { setActiveMentorSession(null); applyFix(activeMentorSession); }} 
                       className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-sm text-slate-200 group">
                       <span className="inline-block w-6 h-6 rounded bg-slate-700 text-center leading-6 mr-3 text-xs font-bold group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">A</span>
                       It prevents O(N) full table scans and optimizes read query performance.
                     </button>
                     <button onClick={() => { setActiveMentorSession(null); applyFix(activeMentorSession); }} 
                       className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-sm text-slate-200 group">
                       <span className="inline-block w-6 h-6 rounded bg-slate-700 text-center leading-6 mr-3 text-xs font-bold group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">B</span>
                       It prevents update anomalies by enforcing strict relational data integrity (3NF).
                     </button>
                     <button onClick={() => { setActiveMentorSession(null); applyFix(activeMentorSession); }} 
                       className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-sm text-slate-200 group">
                       <span className="inline-block w-6 h-6 rounded bg-slate-700 text-center leading-6 mr-3 text-xs font-bold group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">C</span>
                       It solves circular dependency issues in the Object-Relational Mapper (ORM).
                     </button>
                   </div>
                 </div>

               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
