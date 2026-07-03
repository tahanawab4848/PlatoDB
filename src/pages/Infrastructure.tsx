import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Code, Flame, History as HistoryIcon, Download, Zap, Database, ArrowLeft, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { useStore } from "../store/useStore";
import OutputPanel from "../components/db-designer/OutputPanel";
import StressTestModal from "../components/db-designer/StressTestModal";
import ImportSchemaModal from "../components/db-designer/ImportSchemaModal";
import HistoryTimeline from "../components/db-designer/HistoryTimeline";
import ExportReportModal from "../components/db-designer/ExportReportModal";

export default function InfrastructurePage() {
  const { tables, relations, setTables, setRelations, snapshots } = useStore();

  const [outputOpen, setOutputOpen] = useState(false);
  const [stressOpen, setStressOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="relative h-full bg-[#020817] text-slate-200 overflow-y-auto flex flex-col font-sans">
      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 bg-slate-900/40 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/app/designer" className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Infrastructure Hub</h1>
            <p className="text-sm text-slate-400 mt-1">Deploy, test, and manage your generated architecture.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">{tables.length} Tables Designed</span>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Code Card */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code className="w-24 h-24 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/30">
                <Code className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">API Generator</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Generate production-ready Express routes, FastAPI endpoints, and Mongoose models based on your visual schema.
              </p>
              <button onClick={() => setOutputOpen(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25">
                <Zap className="w-4 h-4" /> Open Generator
              </button>
            </div>
          </div>

          {/* Stress Test Card */}
          <div className="bg-gradient-to-br from-rose-900/40 to-slate-900 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame className="w-24 h-24 text-rose-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-6 border border-rose-500/30">
                <Flame className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Extreme Load Simulator</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Simulate 10 million rows to proactively identify missing indexes, N+1 query traps, and read/write bottlenecks.
              </p>
              <button onClick={() => setStressOpen(true)} className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                <Flame className="w-4 h-4" /> Run Simulation
              </button>
            </div>
          </div>

          {/* Import Schema Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Download className="w-24 h-24 text-slate-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 border border-slate-700">
                <Download className="w-6 h-6 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Import Legacy Schema</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Paste existing raw SQL, Prisma, or JSON schemas and let the AI reverse-engineer them into the visual canvas.
              </p>
              <button onClick={() => setImportOpen(true)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                <Download className="w-4 h-4" /> Import Schema
              </button>
            </div>
          </div>

          {/* Export Full Document Card */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-24 h-24 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/30">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Export Project Document</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Download a complete, professionally formatted PDF report containing your Mongoose schemas and REST API specifications.
              </p>
              <button 
                onClick={() => setReportOpen(true)}
                className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" /> Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Version History Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Version History</h2>
              <p className="text-sm text-slate-400">Rollback to previous snapshots of your database architecture.</p>
            </div>
          </div>
          
          {snapshots.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No snapshots saved yet.</p>
              <p className="text-sm text-slate-500 mt-1">Go to the Visual Editor and click "Commit" to save versions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* We embed the HistoryTimeline component, but it's designed to be fixed at the bottom.
                  Let's just re-use the logic or render it inline if possible. 
                  Actually, HistoryTimeline is fixed at bottom in DbDesigner. 
                  We can render it here, but it might be absolutely positioned. Let's just render the list manually for the dashboard for a better look. */}
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-200">{snap.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(snap.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-md">{snap.tables.length} tables</span>
                    <button 
                      onClick={() => { setTables(snap.tables); setRelations(snap.relations); }}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>{outputOpen && <OutputPanel tables={tables} relations={relations} onClose={() => setOutputOpen(false)} />}</AnimatePresence>
      <ImportSchemaModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={(t: any, r: any) => { setTables(t); setRelations(r); }} />
      <StressTestModal isOpen={stressOpen} onClose={() => setStressOpen(false)} tables={tables} relations={relations} />
      <ExportReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} tables={tables} />
    </div>
  );
}
