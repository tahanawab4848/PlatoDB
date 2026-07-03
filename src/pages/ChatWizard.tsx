import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Sparkles, Mic, ChevronRight, Check } from "lucide-react";
import { useStore } from "../store/useStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  options?: string[];
}

type Phase = "pm" | "architect" | "config";
const PHASES: Phase[] = ["pm", "architect", "config"];

function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const lines = [
    "Welcome to PlatoDB AI Architect.",
    "This is a Socratic design engine.",
    "1. Describe the application you want to build.",
    "2. I will interrogate your architectural tradeoffs.",
    "3. Once validated, I will generate your complete database schema.",
    "Booting interface..."
  ];

  useEffect(() => {
    // 0.8s per line, plus 1.5s reading time at the end
    const timer = setTimeout(onComplete, lines.length * 800 + 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
      className="flex flex-col items-start justify-center w-full max-w-3xl mx-auto h-full space-y-6 px-8">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-emerald-400" />
      </div>
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ delay: i * 0.8, duration: 0.6, ease: "easeOut" }}
          className={`text-xl md:text-2xl font-display font-medium ${i === lines.length - 1 ? 'text-emerald-400 animate-pulse mt-12 text-sm uppercase tracking-widest' : 'text-slate-200'}`}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function ChatWizard() {
  const navigate = useNavigate();
  const { setTables, setRelations, currentUser, currentProjectId, setCurrentProjectId } = useStore();
  const [phase, setPhase] = useState<Phase>("pm");
  const [showIntro, setShowIntro] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hi. I'm your AI Product Manager.\nWhat are we building today?",
      options: ["An E-commerce platform", "A SaaS application", "A Social Network", "A custom CRM"]
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [generatingSchema, setGeneratingSchema] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages, isTyping]);

  const conversationText = messages.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");

  const generateSchema = async (conversation: string) => {
    setGeneratingSchema(true);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.tables) {
        if (!currentProjectId) {
          try {
            const createRes = await fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: currentUser?.id || "u1", name: "AI Generated Project" })
            });
            const newProj = await createRes.json();
            setCurrentProjectId(newProj.id);
          } catch (e) {
            console.error("Failed to create backend project", e);
          }
        }
        setTables(data.tables);
        setRelations(data.relations || []);
      }
    } catch (error) {
      console.error("Failed to generate schema:", error);
      // Let the user know the schema generation failed
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, but I encountered an error connecting to the AI backend to generate your schema. Please check your terminal for backend errors or ensure your GROQ_API_KEY is valid in .env.local." 
      }]);
    } finally {
      setGeneratingSchema(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isTyping) return;
    
    // Remove options from previous assistant message
    setMessages(prev => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === "assistant") {
        copy[copy.length - 1].options = [];
      }
      return copy;
    });

    const userMsg: Message = { role: "user", content: textToSend.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!overrideText) setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "24px"; }
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const botMsg: Message = { role: "assistant", content: data.reply, options: data.options || [] };
      setMessages(prev => [...prev, botMsg]);

      if (phase === "pm") {
        setPhase("architect");
      } else if (phase === "architect") {
        setPhase("config");
      } else {
        await generateSchema(conversationText);
        setTimeout(() => navigate("/app/designer"), 1000);
      }
    } catch (error) {
      console.error("API Error:", error);
      // Remove the user's message so they can try again, or append an error message
      const botMsg: Message = { 
        role: "assistant", 
        content: "🚨 **Connection Error**: I couldn't reach the AI brain (Backend Server). Please ensure your backend is running (`npm run server`) and your `GROQ_API_KEY` is configured in `.env.local`.",
        options: ["Retry"]
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full bg-transparent flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-slate-200">
      <AnimatePresence>
        {generatingSchema && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/80 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center w-24 h-24">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-emerald-500 opacity-50" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-r-2 border-green-500 opacity-50" />
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Architecting Database...</h2>
              <p className="text-slate-400">Translating requirements into structured schema</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroSequence key="intro" onComplete={() => setShowIntro(false)} />
        ) : (
          <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-3xl flex flex-col h-[85vh] max-h-[800px] relative">
            
            {/* Sleek top bar */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-8">
            {PHASES.map((p, i) => {
              const active = PHASES.indexOf(phase) >= i;
              const current = phase === p;
              return (
                <div key={p} className={`flex items-center gap-2 ${active ? 'text-emerald-400' : 'text-slate-600'} transition-colors`}>
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${active ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}>
                    {active && !current ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium tracking-wide uppercase">{p === "pm" ? "Requirements" : p === "architect" ? "Architecture" : "Generation"}</span>
                  {i < PHASES.length - 1 && <ChevronRight className={`w-3 h-3 ml-6 ${active ? 'text-emerald-500/30' : 'text-slate-800'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-6 scroll-smooth rounded-3xl bg-[#00111a]/60 backdrop-blur-3xl p-6 md:p-8 border border-emerald-500/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.5)] relative custom-scrollbar">
          {/* Subtle animated background glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="space-y-8 pb-4 relative z-10">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col max-w-[85%] ${m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">AI Architect</span>
                    </div>
                  )}

                  <div className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-[0_8px_30px_rgba(16,185,129,0.25)] border border-emerald-400/20"
                      : "bg-gradient-to-br from-[#012534] to-[#001a25] text-slate-200 border border-emerald-500/10 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                  }`}>
                    {m.content}
                  </div>

                  {/* Options Chips */}
                  {m.options && m.options.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 mt-4 ml-2">
                      {m.options.map(opt => (
                        <button key={opt} onClick={() => handleSend(opt)} disabled={isTyping || generatingSchema}
                          className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex flex-col mr-auto items-start max-w-[85%]">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">AI Architect</span>
                  </div>
                  <div className="px-6 py-5 bg-gradient-to-br from-[#012534] to-[#001a25] border border-emerald-500/10 rounded-3xl rounded-tl-sm flex gap-2 items-center h-[52px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} className="h-4" />
          </div>
        </div>

        {/* Input Bar - Sleek Floating Style */}
        <div className="relative shrink-0">
          <div className="absolute -inset-2 bg-emerald-500/5 rounded-[2rem] blur-xl opacity-50" />
          <div className="relative flex items-end gap-3 bg-[#001722]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.04] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] focus-within:border-emerald-500/30 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
            
            <button className="p-3 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 bg-white/[0.02] hover:bg-emerald-500/10 rounded-full">
              <Mic className="w-5 h-5" />
            </button>

            <textarea ref={textareaRef} rows={1} value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isTyping || generatingSchema}
              placeholder="Ask the AI Architect..."
              className="flex-1 bg-transparent text-[16px] text-slate-200 placeholder-slate-600 focus:outline-none resize-none py-3 leading-relaxed min-h-[24px] disabled:cursor-not-allowed font-sans custom-scrollbar"
              style={{ height: "24px" }}
            />

            <button onClick={() => handleSend()} disabled={isTyping || !input.trim() || generatingSchema}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shrink-0 mb-0.5 ${
                input.trim() 
                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}>
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
