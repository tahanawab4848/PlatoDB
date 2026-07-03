import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function HistoryTimeline({ snapshots, onRollback }: any) {
  if (snapshots.length === 0) return null;
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-xl flex items-center gap-3 shadow-2xl z-40 overflow-x-auto max-w-[80vw]">
      <div className="pl-3 pr-2 border-r border-slate-700/50">
        <Clock className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex items-center gap-2 px-2">
        {snapshots.map((snap: any, i: number) => (
          <motion.button key={snap.id} onClick={() => onRollback(snap)} className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-300 shrink-0 shadow-sm transition-colors flex items-center justify-center text-xs font-semibold text-slate-300">
            {i+1}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
