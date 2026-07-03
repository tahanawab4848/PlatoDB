import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, Database, GitMerge, Layers, Layers2, Shield, CreditCard, Hash, ChevronDown } from "lucide-react";
import { useStore } from "../../store/useStore";

const QUICK_ACTIONS = [
  { id: "add_auth", label: "Add Auth", icon: Shield, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { id: "normalize", label: "Normalize", icon: Layers, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { id: "denormalize", label: "Denormalize", icon: Layers2, color: "text-green-400 bg-green-400/10 border-green-400/20" },
  { id: "add_index", label: "Fix Indexes", icon: Hash, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { id: "split_payments", label: "Split Payments", icon: CreditCard, color: "text-teal-400 bg-teal-400/10 border-teal-400/20" },
];

export default function AiCopilot({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { tables, relations, setTables, setRelations, selectedTableId } = useStore();
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const [messages, setMessages] = useState<{ role: string; content: string; isAction?: boolean }[]>([
    { role: "bot", content: "I'm your AI Database Co-Pilot. Select a table and use a quick action, or ask me anything about your schema." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const callCopilot = async (action: string | null, userMessage: string) => {
    setIsLoading(true);
    const displayMsg = userMessage || QUICK_ACTIONS.find(a => a.id === action)?.label || action || "";
    setMessages(prev => [...prev, { role: "user", content: displayMsg, isAction: !!action }]);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, selectedTableId, tables, relations, userMessage }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      if (data.tables) {
        setTables(data.tables);
        setRelations(data.relations || relations);
        setMessages(prev => [...prev, {
          role: "bot",
          content: `✅ Done! ${data.message || "Schema updated."}`
        }]);
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "bot",
        content: "⚠️ Could not reach backend. Make sure the server is running with Start-PlatoDB.bat"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    callCopilot(null, input.trim());
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="absolute right-4 top-20 bottom-24 w-[400px] bg-[rgba(10,10,20,0.65)] backdrop-blur-2xl border border-white/[0.08] z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-white tracking-wide">AI Co-Pilot</h2>
                <p className="text-[10px] text-slate-400 font-sans">Schema intelligence · Live updates</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selected table context */}
          <AnimatePresence>
            {selectedTable && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-b border-white/[0.08] bg-emerald-500/[0.03] overflow-hidden">
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-semibold text-emerald-300 font-sans">Context: <span className="text-white bg-white/5 px-2 py-0.5 rounded-md ml-1 border border-white/10">{selectedTable.name}</span></span>
                    <span className="text-[10px] text-slate-500 ml-auto font-mono bg-black/30 px-2 rounded-full">{selectedTable.columns.length} cols</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map(action => {
                      const Icon = action.icon;
                      return (
                        <button key={action.id} onClick={() => callCopilot(action.id, action.label)} disabled={isLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all hover:scale-105 active:scale-95 disabled:opacity-40 ${action.color.replace('rounded-lg', '')} bg-opacity-10 backdrop-blur-md`}>
                          <Icon className="w-3.5 h-3.5" /> {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedTable && (
            <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-950/20">
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <ChevronDown className="w-3 h-3" /> Click a table node in the canvas to enable quick actions
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 font-sans">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col max-w-[90%] ${m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  
                  {m.role === "bot" && (
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">AI Co-Pilot</span>
                    </div>
                  )}

                  <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? m.isAction
                        ? "bg-white/5 text-slate-300 border border-white/10 rounded-br-sm italic font-medium shadow-md"
                        : "bg-emerald-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                      : "bg-white/[0.04] text-slate-200 border border-white/[0.06] rounded-tl-sm shadow-md"
                  }`}>{m.content}</div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col mr-auto items-start max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">AI Co-Pilot</span>
                  </div>
                  <div className="px-4 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] text-slate-400 ml-2 font-medium">Updating schema...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-3 border-t border-white/[0.08] bg-white/[0.01]">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 rounded-xl blur opacity-50 transition-opacity duration-300" />
              <div className="relative flex gap-2 items-center bg-[#012b3d] rounded-xl border border-white/[0.1] p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all shadow-xl">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none pl-2 font-sans"
                  placeholder="Ask AI to modify schema..."
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()}
                  className="w-8 h-8 bg-white hover:bg-slate-200 text-black rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-white shrink-0 shadow-md">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
