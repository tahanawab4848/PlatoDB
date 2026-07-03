import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Database, ArrowRight, Cpu, Globe, Layers, Zap, Sparkles, Code2, Shield, GitMerge, LogIn, FileText, History, BookOpen, MessageSquare } from "lucide-react";
import { useStore } from "../store/useStore";

// ── Floating Orb ────────────────────────────────────────────
function Orb({ x, y, size, color, delay }: any) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(80px)" }}
      animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ── Animated Counter ────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(timer); }
          else setVal(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Live DB Preview Card ────────────────────────────────────
function LivePreview() {
  const tables = [
    { name: "users", color: "#10b981", cols: ["_id: ObjectId", "email: String", "role: String"] },
    { name: "posts", color: "#22c55e", cols: ["_id: ObjectId", "userId: ObjectId", "content: String"] },
    { name: "comments", color: "#14b8a6", cols: ["_id: ObjectId", "postId: ObjectId", "text: String"] },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive(p => (p + 1) % 3), 2000); return () => clearInterval(t); }, []);

  return (
    <div className="relative w-full rounded-2xl bg-[#012534] border border-white/10 overflow-hidden shadow-2xl">
      {/* Fake toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#023447] border-b border-white/5">
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-[#ff5f57]"/><div className="w-3 h-3 rounded-full bg-[#febc2e]"/><div className="w-3 h-3 rounded-full bg-[#28c840]"/></div>
        <div className="flex-1 mx-4 bg-white/5 rounded-md px-3 py-1 text-[10px] text-slate-500">localhost:5173/app/designer</div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>Live
        </div>
      </div>
      {/* Canvas area */}
      <div className="relative h-64 flex items-center justify-center gap-8 p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #10b981 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {tables.map((t, i) => (
          <motion.div key={t.name} animate={{ scale: active === i ? 1.06 : 1, y: active === i ? -4 : 0 }}
            className="relative z-10 bg-[#023d53] border rounded-xl overflow-hidden cursor-pointer min-w-[140px]"
            style={{ borderColor: active === i ? t.color : "#1e293b", boxShadow: active === i ? `0 0 20px ${t.color}44` : "none" }}>
            <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1.5" style={{ background: `${t.color}15` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
              <span className="text-[11px] font-bold text-white">{t.name}</span>
            </div>
            <div className="p-2 space-y-1">
              {t.cols.map(c => <div key={c} className="text-[9px] font-mono text-slate-400 px-1">{c}</div>)}
            </div>
          </motion.div>
        ))}
        {/* Animated connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          <motion.path d="M 175 130 C 220 130, 220 130, 265 130" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <motion.path d="M 390 130 C 435 130, 435 130, 480 130" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 4" animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        </svg>
      </div>
      {/* AI CTO Bottom Docked Panel */}
      <motion.div className="absolute bottom-0 left-0 right-0 h-16 bg-[#001e2b]/95 backdrop-blur-md border-t border-rose-500/30 flex items-center justify-between px-4"
        animate={{ y: [20, 0] }} transition={{ duration: 0.5, delay: 1 }}>
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Socratic CTO Issues</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">1 Issue</span>
        </div>
        <button className="text-[10px] px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors font-bold flex items-center gap-1.5 shadow-lg">
          <BookOpen className="w-3 h-3" /> Learn & Resolve
        </button>
      </motion.div>
    </div>
  );
}

// ── Feature Card ────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, gradient, delay, link }: any) {
  const [hovered, setHovered] = useState(false);
  
  const CardContent = (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.6 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="relative p-6 rounded-2xl bg-[#012b3d] border border-white/5 overflow-hidden group h-full flex flex-col"
      style={{ boxShadow: hovered ? `0 0 40px ${color}22` : "none", borderColor: hovered ? `${color}30` : undefined, transition: "all 0.3s" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: gradient }} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{desc}</p>
        {link && (
          <div className="flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color }}>
            Try it now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  );

  return link ? <Link to={link} className="block h-full cursor-pointer">{CardContent}</Link> : <div className="h-full">{CardContent}</div>;
}

// ── MAIN LANDING ────────────────────────────────────────────
export default function LandingPage() {
  const { currentUser, setCurrentUser } = useStore();
  const navigate = useNavigate();
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    mouseX.set((e.clientX / window.innerWidth - 0.5) * 5);
    mouseY.set((e.clientY / window.innerHeight - 0.5) * 5);
  };

  const features = [
    { icon: Cpu, title: "Socratic Product Manager", desc: "Describe your app. Instead of just building it, the AI quizzes you on tradeoffs: 'Should the cart be in-memory or persisted? Why?'", color: "#10b981", gradient: "radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 60%)", delay: 0, link: "/app/setup" },
    { icon: Database, title: "Principal DB Architect", desc: "Doesn't just create tables — explains WHY. 'Orders is separated because this avoids update anomalies and satisfies 3NF.'", color: "#22c55e", gradient: "radial-gradient(circle at top left, rgba(34,197,94,0.08), transparent 60%)", delay: 0.1, link: "/app/setup" },
    { icon: Sparkles, title: "Accessible Cmd+K Interface", desc: "Keyboard-first design. Visually impaired? Power user? Use the global Cmd+K palette to build your entire schema via keyboard.", color: "#14b8a6", gradient: "radial-gradient(circle at top left, rgba(20,184,166,0.08), transparent 60%)", delay: 0.2, link: "/app/designer" },
    { icon: Shield, title: "Mandatory Mentorship", desc: "No more 'Auto-Fix'. The CTO opens a docked IDE Problems Panel. You MUST read the theory and pass a quiz to apply architectural fixes.", color: "#f59e0b", gradient: "radial-gradient(circle at top left, rgba(245,158,11,0.08), transparent 60%)", delay: 0.3, link: "/app/designer" },
    { icon: Zap, title: "Big O Execution Visualizer", desc: "Type a query. Watch an animated packet scan your tables. Visually learn the devastating difference between O(N) and O(log N).", color: "#ef4444", gradient: "radial-gradient(circle at top left, rgba(239,68,68,0.08), transparent 60%)", delay: 0.4, link: "/app/designer" },
    { icon: FileText, title: "Annotated Code Export", desc: "Download heavily commented Mongoose schemas. Every column includes JSDoc comments explaining the design rationale to judges.", color: "#10b981", gradient: "radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 60%)", delay: 0.5, link: "/app/designer" },
    { icon: Globe, title: "Real-Time Multiplayer", desc: "Built on Socket.io. Watch your team's cursors move live. Schema changes sync instantly — no refresh needed.", color: "#06b6d4", gradient: "radial-gradient(circle at top left, rgba(6,182,212,0.08), transparent 60%)", delay: 0.6, link: "/app/designer" },
    { icon: GitMerge, title: "PDF Study Guides", desc: "Generate professional ERD PDF Reports. These personalized reports act as dynamic study guides to help you memorize your system's relational map and definitions.", color: "#3b82f6", gradient: "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 60%)", delay: 0.7, link: "/app/designer" },
    { icon: History, title: "Rolling Time-Travel", desc: "Made a mistake? Instantly revert structural changes using our ultra-fast 10-snapshot rolling project history buffer.", color: "#f43f5e", gradient: "radial-gradient(circle at top left, rgba(244,63,94,0.08), transparent 60%)", delay: 0.8, link: "/app/designer" },
  ];

  return (
    <div className="bg-transparent text-white overflow-x-hidden" onMouseMove={handleMouse}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5" style={{ background: "linear-gradient(to bottom, rgba(5,5,15,0.9), transparent)", backdropFilter: "blur(12px)" }}>
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">PlatoDB</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link to="/app/setup" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> AI PM Setup</Link>
          <Link to="/app/designer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><Layers className="w-4 h-4" /> Visual IDE</Link>
          <Link to="/app/learning-lab" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> CS Lab</Link>
        </div>
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <Link to="/app/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <button onClick={() => { setCurrentUser(null); navigate('/'); }} className="text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors">Log out</button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
          <Link to={currentUser ? "/app/setup" : "/auth"} className="group flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-white text-black hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            {currentUser ? "New Project" : "Start Building"} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
        {/* Orbs */}
        <Orb x="10%" y="20%" size={500} color="rgba(16,185,129,0.25)" delay={0} />
        <Orb x="65%" y="10%" size={400} color="rgba(34,197,94,0.2)" delay={2} />
        <Orb x="50%" y="60%" size={300} color="rgba(20,184,166,0.15)" delay={4} />

        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(to right, #10b981 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <motion.div style={{ x: springX, y: springY }} className="relative z-10 text-center max-w-6xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur mb-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wide">The Interactive EdTech Sandbox for System Design</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
            className="text-6xl md:text-8xl font-display font-black leading-[1.05] tracking-tighter mb-8">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">Master system design</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">by building it visually.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            PlatoDB is an intelligent educational platform that teaches computer science fundamentals. Instead of just generating code for you, our <strong className="text-white">AI Socratic Mentor</strong> halts your mistakes, quizzes you on <strong className="text-white">Big O complexity</strong>, and generates extensive <strong className="text-white">ERD Study Guides</strong> to solidify your learning before you proceed.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center justify-center gap-5">
            <Link to={currentUser ? "/app/setup" : "/auth"} className="group relative px-8 py-4 rounded-full font-bold text-lg text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #10b981, #22c55e, #14b8a6)", boxShadow: "0 0 50px rgba(16,185,129,0.5)" }}>
              <span className="relative flex items-center gap-2">{currentUser ? "Start New Project" : "Sign In to Start"} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <a href="#demo" className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 backdrop-blur">
              Watch it live ↓
            </a>
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 font-medium">
             <Link to="/app/setup" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><MessageSquare className="w-4 h-4" /> AI Socratic PM Setup</Link>
             <span className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block" />
             <Link to="/app/designer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Layers className="w-4 h-4" /> Visual Database IDE</Link>
             <span className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block" />
             <Link to="/app/learning-lab" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><BookOpen className="w-4 h-4" /> CS Learning Lab</Link>
          </motion.div>
        </motion.div>

        {/* Hero bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#001e2b] to-transparent pointer-events-none z-10" />
      </section>

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mb-4 font-sans">Interactive Classroom</p>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
              See the Socratic Mentor in action.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">This isn't a static mockup. Below is the actual interface students use to design databases. Notice how the AI CTO intercepts the workflow at the bottom, forcing the student to resolve missing indexes to learn about O(N) bottlenecks.</p>
          </div>
          <LivePreview />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-20 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 100, suffix: "%", label: "WCAG Keyboard Accessible" },
            { target: 4, suffix: " AI", label: "Mentors guiding your design" },
            { target: 0, suffix: " BS", label: "Pure educational value" },
            { target: 100, suffix: "%", label: "Annotated Code Export" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-4xl md:text-5xl font-display font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400 mb-2">
                <Counter target={s.target} suffix={s.suffix} />
              </div>
              <p className="text-slate-500 text-sm font-sans">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mb-4 font-sans">The EdTech Intelligence Layer</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-6xl font-display font-black tracking-tight mb-6">
            Your personal<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">Mastery Mentor.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-slate-400 max-w-xl mx-auto font-sans">
            Not just a diagram tool. An intelligent educational partner that forces you to understand the "why" behind every architectural decision.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── FLOW STEPS ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-black tracking-tight mb-4">From beginner to systems architect.</h2>
          <p className="text-slate-400 font-sans">Learn computer science fundamentals by building.</p>
        </div>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
          {[
            { num: "01", title: "Discuss your tradeoffs", desc: "Tell the AI PM your idea. It quizzes you on state management and relational trade-offs before proceeding.", color: "#10b981" },
            { num: "02", title: "Architect explains", desc: "The AI Principal Architect designs the schema and attaches educational JSDoc comments to every single generated column.", color: "#22c55e" },
            { num: "03", title: "Accessible Canvas", desc: "Use the mouse, or trigger the Cmd+K Command Palette to design the entire architecture using rapid keyboard inputs.", color: "#14b8a6" },
            { num: "04", title: "Mandatory Mentorship", desc: "The docked Problems Panel catches your mistakes. You must read the theory and pass the multiple-choice quiz before it allows the fix.", color: "#f59e0b" },
            { num: "05", title: "Export & Learn", desc: "Download heavily annotated, production-ready Mongoose models. The learning continues directly inside your IDE.", color: "#06b6d4" },
          ].map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative flex gap-8 pb-12 last:pb-0 pl-20">
              <div className="absolute left-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black border"
                style={{ background: `${step.color}10`, borderColor: `${step.color}25`, color: step.color }}>
                {step.num}
              </div>
              <div className="pt-3">
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="py-32 px-6 relative overflow-hidden text-center">
        <Orb x="30%" y="0%" size={600} color="rgba(16,185,129,0.15)" delay={0} />
        <Orb x="60%" y="20%" size={400} color="rgba(34,197,94,0.15)" delay={1} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-8 leading-tight">
            Stop sketching.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Start engineering.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-slate-400 mb-12 font-sans">
            Your next database architecture is one conversation away.
          </motion.p>
          <Link to={currentUser ? "/app/setup" : "/auth"} className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #10b981, #22c55e)", boxShadow: "0 0 60px rgba(16,185,129,0.5), 0 0 120px rgba(16,185,129,0.2)" }}>
            <Sparkles className="w-6 h-6" /> {currentUser ? "Launch PlatoDB" : "Sign in & Launch"} <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
