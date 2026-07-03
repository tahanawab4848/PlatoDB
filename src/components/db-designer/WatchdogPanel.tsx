import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, BookOpen, X, ChevronRight, CheckCircle2 } from "lucide-react";

export default function WatchdogPanel({ tables, relations, onFix }: any) {
  const [warnings, setWarnings] = useState<any[]>([]);
  const [learningModal, setLearningModal] = useState<any>(null);
  
  useEffect(() => {
    const newWarnings: any[] = [];
    
    tables.forEach((t: any) => {
      // Rule 1: Missing Indexes on Foreign Keys (Simulated)
      relations.filter((r: any) => r.fromTable === t.id).forEach((r: any) => {
        const fkCol = t.columns.find((c: any) => c.name === r.fromColumn);
        if (fkCol && !fkCol.isIndexed && !fkCol.isPK && !fkCol.isUnique) {
          newWarnings.push({
            id: `missing_index_${t.id}_${fkCol.name}`,
            title: `Missing Index on ${t.name}.${fkCol.name}`,
            desc: `Foreign keys without indexes cause full table scans (O(N) time) during JOIN operations.`,
            topic: "indexing",
            fixAction: { tableId: t.id, columnId: fkCol.id, fixType: 'add_index' }
          });
        }
      });
      
      // Rule 2: Normalization (Detecting city/country clusters)
      const hasCity = t.columns.find((c:any) => c.name.toLowerCase().includes("city"));
      const hasCountry = t.columns.find((c:any) => c.name.toLowerCase().includes("country"));
      if (hasCity && hasCountry) {
         newWarnings.push({
            id: `normalization_${t.id}`,
            title: `Normalization Risk in ${t.name}`,
            desc: `Storing both City and Country directly causes update anomalies. Consider moving to a Location lookup table (3NF).`,
            topic: "normalization"
         });
      }
    });

    setWarnings(newWarnings);
  }, [tables, relations]);

  if (warnings.length === 0) return null;

  return (
    <>
      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-3 w-80">
        <AnimatePresence>
          {warnings.map((w, i) => (
             <motion.div key={w.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.1 }}
               className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-[0_10px_30px_rgba(245,158,11,0.1)] backdrop-blur">
               <div className="flex items-start gap-3">
                 <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">AI CTO Watchdog</h4>
                   <p className="text-xs text-slate-300 font-medium mb-1">{w.title}</p>
                   <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{w.desc}</p>
                   <div className="flex items-center gap-2">
                     <button onClick={() => setLearningModal(w.topic)} className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border border-emerald-500/20">
                       <BookOpen className="w-3 h-3" /> Learn Why
                     </button>
                     {w.fixAction && (
                       <button onClick={() => onFix(w.fixAction)} className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/20">
                         <CheckCircle2 className="w-3 h-3" /> Auto-Fix
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {learningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
               <button onClick={() => setLearningModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors z-10"><X className="w-5 h-5" /></button>
               
               {learningModal === "indexing" && (
                 <div className="p-6">
                   <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 border border-amber-500/30">
                     <BookOpen className="w-6 h-6 text-amber-400" />
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">Why Indexes Matter</h2>
                   <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                     When you query a column without an index, the database must scan every single row (Sequential Scan). An index builds a B-Tree, reducing search time exponentially.
                   </p>
                   <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs flex flex-col gap-3">
                     <div className="flex justify-between items-center text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping"/>
                         <span>No Index (Table Scan)</span>
                       </div>
                       <span>Time: O(N)</span>
                     </div>
                     <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"/>
                         <span>With Index (B-Tree)</span>
                       </div>
                       <span>Time: O(log N)</span>
                     </div>
                   </div>
                 </div>
               )}

               {learningModal === "normalization" && (
                 <div className="p-6">
                   <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 border border-amber-500/30">
                     <BookOpen className="w-6 h-6 text-amber-400" />
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">3rd Normal Form (3NF)</h2>
                   <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                     Storing fields like City and Country directly in a User table causes "Update Anomalies". If a country changes its name, you must update millions of user records instead of one Location record.
                   </p>
                   <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs flex gap-4">
                     <div className="flex-1 opacity-50">
                       <span className="text-rose-400 font-bold block mb-2">Bad (1NF)</span>
                       <div className="bg-slate-900 p-3 rounded border border-rose-500/30 text-slate-300 shadow-inner">Users [name, city, country]</div>
                     </div>
                     <div className="flex items-center"><ChevronRight className="w-5 h-5 text-slate-500"/></div>
                     <div className="flex-1">
                       <span className="text-emerald-400 font-bold block mb-2">Good (3NF)</span>
                       <div className="bg-slate-900 p-3 rounded border border-emerald-500/30 text-slate-300 mb-2 shadow-inner">Users [name, location_id]</div>
                       <div className="bg-slate-900 p-3 rounded border border-emerald-500/30 text-slate-300 shadow-inner">Locations [id, city, country]</div>
                     </div>
                   </div>
                 </div>
               )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
