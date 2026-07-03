import { useState } from "react";
import { motion } from "framer-motion";
import { X, Flame, Loader2, Target, AlertTriangle, RotateCcw, WifiOff } from "lucide-react";

interface Bottleneck {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  solution: string;
}

interface StressResult {
  overallRiskScore: number;
  bottlenecks: Bottleneck[];
}

const SEVERITY_STYLE: Record<string, string> = {
  High: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export default function StressTestModal({ isOpen, onClose, tables, relations }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<StressResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, relations }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (e: any) {
      // Check if it's a network failure (backend offline)
      if (e instanceof TypeError && e.message.includes("fetch")) {
        setError("backend_offline");
      } else {
        setError(e.message || "Unknown error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const runMockSimulation = () => {
    setIsProcessing(true);
    setError(null);
    setTimeout(() => {
      setResult({
        overallRiskScore: 62,
        bottlenecks: [
          {
            title: "O(N) Full Table Scan Detected",
            description: "Querying without an index forces the database engine to perform a sequential scan checking every single row. At 10M rows, this will cause a catastrophic bottleneck.",
            severity: "High",
            solution: "Add a unique index: db.users.createIndex({ email: 1 }, { unique: true })",
          },
          {
            title: "Unoptimized O(N log N) Sort Pattern",
            description: "Queries filtering by (userId + createdAt) will be slow without a compound index covering both fields. The database has to sort results in memory.",
            severity: "Medium",
            solution: "db.posts.createIndex({ userId: 1, createdAt: -1 })",
          },
          {
            title: "O(1) BSON Limit Risk: Embedded Arrays",
            description: "If any field stores an array of sub-documents, MongoDB documents can exceed the 16MB BSON limit at scale, causing write failures.",
            severity: "Low",
            solution: "Normalize large arrays into their own collections with reference IDs.",
          },
        ],
      });
      setIsProcessing(false);
    }, 2200);
  };

  if (!isOpen) return null;

  const scoreColor =
    result && result.overallRiskScore > 70
      ? "text-rose-400"
      : result && result.overallRiskScore > 40
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] ring-1 ring-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0 bg-gradient-to-r from-rose-500/5 to-transparent">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
            <Target className="w-5 h-5 text-rose-400" /> Big O Execution Visualizer
            <span className="text-xs font-normal text-slate-500 ml-1">Query Plan Analysis</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Error State */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                {error === "backend_offline"
                  ? <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    {error === "backend_offline" ? "Backend server is offline" : "API Error"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {error === "backend_offline"
                      ? "Make sure you ran Start-PlatoDB.bat which starts node server/index.js on port 5000."
                      : error}
                  </p>
                </div>
              </div>
              <button
                onClick={runMockSimulation}
                className="self-start flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Run Demo Simulation Instead
              </button>
            </motion.div>
          )}

          {/* Initial State */}
          {!result && !error && (
            <div className="text-center py-10">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl flex items-center justify-center">
                  <Flame className="w-12 h-12 text-rose-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Visualize Query Plan</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
                Enter a hypothetical query, and the visualizer will animate the execution plan, teaching you about O(N) vs O(log N) lookup times and identifying bottlenecks.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleAction}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Flame className="w-4 h-4" />}
                  {isProcessing ? "Analyzing..." : "Run Query Trace"}
                </button>
                <button
                  onClick={runMockSimulation}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
                >
                  <Flame className="w-4 h-4 text-slate-500" /> Demo Result
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Score */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-6">
                <div className={`text-7xl font-black tabular-nums ${scoreColor}`}>
                  {result.overallRiskScore}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Architectural Risk Score</p>
                  <p className={`text-sm font-semibold ${scoreColor}`}>
                    {result.overallRiskScore > 70 ? "🔴 High Risk — Needs attention before launch" : result.overallRiskScore > 40 ? "🟡 Medium Risk — Some optimizations needed" : "🟢 Low Risk — Schema looks solid"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{result.bottlenecks?.length || 0} issues found</p>
                </div>
                <button onClick={() => { setResult(null); setError(null); }} className="ml-auto p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Bottlenecks */}
              {result.bottlenecks?.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-200 text-sm">{b.title}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0 ${SEVERITY_STYLE[b.severity] || SEVERITY_STYLE.Medium}`}>
                      {b.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-xs font-mono text-emerald-300 leading-relaxed">
                      <span className="font-bold text-emerald-400">Fix → </span>{b.solution}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
