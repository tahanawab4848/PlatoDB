import { useState } from "react";
import { motion } from "framer-motion";
import { X, Code, Loader2, FileCode2 } from "lucide-react";

export default function ImportSchemaModal({ isOpen, onClose, onImport }: any) {
  const [inputStr, setInputStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/parse-schema", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawSchema: inputStr }),
      });
      const data = await res.json();
      onImport(data.tables || [], data.relations || []);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020817]/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100"><FileCode2 className="w-5 h-5 text-emerald-400" /> Reverse Engineer</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 bg-slate-950/30">
          <p className="text-sm font-medium text-slate-400 mb-4">Paste your raw Mongoose, Prisma, or SQL schema. The neural engine will map it instantly.</p>
          <textarea
            className="w-full h-64 bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 font-mono text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none shadow-inner"
            placeholder="CREATE TABLE users..."
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button onClick={handleAction} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all">
            {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : "Parse & Draw"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
