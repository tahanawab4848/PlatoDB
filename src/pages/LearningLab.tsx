import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Database, Target, Search, LayoutList, Fingerprint, Cpu, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useStore } from "../store/useStore";

export default function LearningLab() {
  const { tables } = useStore();
  const [activeTab, setActiveTab] = useState<"normalization" | "indexing" | "cap">("normalization");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const hasTables = tables.length > 0;
  const allHavePK = tables.every(t => t.columns.some(c => c.isPK));

  useEffect(() => {
    if (!hasTables) return;
    
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/learning-lab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tables, topic: activeTab })
        });
        const data = await res.json();
        setAiAnalysis(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [activeTab, tables]);

  return (
    <div className="min-h-screen bg-[#001e2b] text-slate-200 p-8 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/app/designer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-display font-black text-white">CS Learning Lab</h1>
            <p className="text-slate-400">Run dynamic computer science operations on your current architecture.</p>
          </motion.div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-px">
          {[
            { id: "normalization", label: "Normalization (1NF-3NF)", icon: LayoutList },
            { id: "indexing", label: "Indexing & Big O", icon: Search },
            { id: "cap", label: "CAP Theorem", icon: Target }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold transition-colors relative ${activeTab === tab.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Education / Theory */}
          <motion.div key={activeTab + "-left"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTab === "normalization" ? "Database Normalization" : activeTab === "indexing" ? "Time Complexity" : "The CAP Theorem"}
              </h3>
              <div className="text-slate-400 text-sm space-y-4 leading-relaxed">
                {activeTab === "normalization" && (
                  <>
                    <p>Normalization reduces data redundancy and prevents insertion, update, and deletion anomalies.</p>
                    <ul className="list-disc pl-4 space-y-3 mt-4 text-slate-300">
                      <li><strong className="text-white">1NF:</strong> Atomic values, unique records.</li>
                      <li><strong className="text-white">2NF:</strong> 1NF + no partial dependencies (usually solved by single-column PKs).</li>
                      <li><strong className="text-white">3NF:</strong> 2NF + no transitive dependencies.</li>
                    </ul>
                  </>
                )}
                {activeTab === "indexing" && (
                  <>
                    <p>Indexes are B-Trees that allow databases to find rows without scanning the entire table.</p>
                    <ul className="list-disc pl-4 space-y-3 mt-4 text-slate-300">
                      <li><strong className="text-white">Full Table Scan:</strong> <span className="text-rose-400 font-mono bg-rose-500/10 px-1 rounded ml-1 border border-rose-500/20">O(N)</span> Time.</li>
                      <li><strong className="text-white">Indexed Lookup:</strong> <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded ml-1 border border-emerald-500/20">O(log N)</span> Time.</li>
                    </ul>
                  </>
                )}
                {activeTab === "cap" && (
                  <>
                    <p>A distributed data store can only guarantee two of the following three traits:</p>
                    <ul className="list-disc pl-4 space-y-3 mt-4 text-slate-300">
                      <li><strong className="text-white">Consistency:</strong> Every read receives the most recent write.</li>
                      <li><strong className="text-white">Availability:</strong> Every request receives a (non-error) response.</li>
                      <li><strong className="text-white">Partition Tolerance:</strong> System continues despite network drops.</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Active Project Analysis */}
          <div className="md:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Dynamic AI Analysis
                </h3>
                {aiAnalysis && !loading && (
                   <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`px-4 py-1.5 rounded-full text-sm font-black border ${aiAnalysis.grade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : aiAnalysis.grade === 'B' ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'} shadow-[0_0_15px_rgba(16,185,129,0.15)]`}>
                     Grade: {aiAnalysis.grade}
                   </motion.span>
                )}
              </div>
              
              {!hasTables ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500">
                  <Database className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your schema is empty. Design tables first to run CS operations.</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center flex-1 text-emerald-500/50">
                  <Cpu className="w-12 h-12 mb-4 animate-pulse" />
                  <p className="animate-pulse font-mono text-sm tracking-widest">ANALYZING ARCHITECTURE...</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 relative z-10">
                    
                    {/* AI Feedback Box */}
                    {aiAnalysis && (
                      <div className="bg-slate-950/80 border border-emerald-500/30 p-5 rounded-xl shadow-lg backdrop-blur-sm">
                        <h4 className="text-lg font-bold text-white mb-2">{aiAnalysis.feedbackTitle}</h4>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">{aiAnalysis.analysis}</p>
                        
                        {aiAnalysis.actionableAdvice && aiAnalysis.actionableAdvice.length > 0 && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                            <h5 className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4" /> Actionable Fixes</h5>
                            <ul className="space-y-2">
                              {aiAnalysis.actionableAdvice.map((advice: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                  <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                                  {advice}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive UI Tools */}
                    <div className="mt-8">
                      {activeTab === "normalization" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl border border-slate-700 bg-slate-900 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-slate-200">1NF Verification</h4>
                              {allHavePK ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">Ensuring every table has a Primary Key identifier.</p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: allHavePK ? '100%' : '30%' }} className={`h-full ${allHavePK ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </div>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl border border-slate-700 bg-slate-900 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-slate-200">2NF & 3NF Scans</h4>
                              <Cpu className="w-5 h-5 text-teal-400" />
                            </div>
                            <p className="text-xs text-slate-400 mb-2">AI checking for transitive dependencies across relations.</p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-teal-500" />
                            </div>
                          </motion.div>
                        </div>
                      )}

                      {activeTab === "indexing" && (
                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {tables.map(t => {
                            const indexedCols = t.columns.filter(c => c.isPK || c.isUnique);
                            const unindexedCols = t.columns.filter(c => !c.isPK && !c.isUnique);
                            return (
                              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                                <h4 className="font-bold text-slate-300 w-1/4 truncate">{t.name}</h4>
                                <div className="flex-1 flex gap-2 overflow-x-auto items-center px-4">
                                  {indexedCols.map(c => <span key={c.id} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-mono border border-emerald-500/30 whitespace-nowrap"><Sparkles className="w-3 h-3 inline mr-1" />{c.name}</span>)}
                                  {unindexedCols.map(c => <span key={c.id} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono border border-slate-700 whitespace-nowrap">{c.name}</span>)}
                                </div>
                                <div className="w-20 text-right">
                                  <span className={`text-xs font-black ${indexedCols.length > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>O({indexedCols.length > 0 ? 'log N' : 'N'})</span>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}

                      {activeTab === "cap" && (
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-5 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all text-left group shadow-lg">
                            <h5 className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">CP System</h5>
                            <p className="text-xs text-slate-400 mb-3">Prioritize Consistency. Safe for financial transactions.</p>
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase">MongoDB / SQL</span>
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-5 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 hover:border-teal-500 rounded-xl transition-all text-left group shadow-lg">
                            <h5 className="font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">AP System</h5>
                            <p className="text-xs text-slate-400 mb-3">Prioritize Availability. Best for social media feeds.</p>
                            <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-1 rounded font-bold uppercase">Cassandra</span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
