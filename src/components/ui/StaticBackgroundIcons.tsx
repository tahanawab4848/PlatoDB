import { useEffect, useState } from "react";
import { Database, Sparkles, Brain, Code, Terminal, Bot, Network, Server, Zap, Cpu, MemoryStick } from "lucide-react";

export default function StaticBackgroundIcons() {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // We define a larger set of tech icons and strings
  const ICONS = [
    <Database key="1" className="w-8 h-8" />,
    <Server key="2" className="w-10 h-10" />,
    <Sparkles key="3" className="w-6 h-6" />,
    <Brain key="4" className="w-12 h-12" />,
    <Bot key="5" className="w-10 h-10" />,
    <Network key="6" className="w-8 h-8" />,
    <Code key="7" className="w-10 h-10" />,
    <Terminal key="8" className="w-8 h-8" />,
    <Zap key="9" className="w-12 h-12" />,
    <Cpu key="10" className="w-14 h-14" />,
    <span key="11" className="text-4xl font-bold font-mono">{"{ }"}</span>,
    <span key="12" className="text-4xl font-bold font-mono">{"< />"}</span>,
    <span key="13" className="text-4xl font-bold font-mono">{"[ ]"}</span>,
    <span key="14" className="text-5xl font-bold font-mono">#</span>,
    <span key="15" className="text-5xl font-bold font-mono">;</span>
  ];

  // Randomly distribute them across the screen in fixed positions but animate them gently
  // We use a seeded-like approach so they don't jump on every react render,
  // but for simplicity, useMemo or running once is fine.
  
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate 30 background particles once
    const newParticles = Array.from({ length: 30 }).map((_, i) => {
      return {
        id: i,
        icon: ICONS[i % ICONS.length],
        x: Math.random() * 100, // vw
        y: Math.random() * 100, // vh
        duration: 15 + Math.random() * 20, // 15s to 35s animation cycle
        delay: Math.random() * -20, // Start at different points
        opacity: 0.03 + Math.random() * 0.05, // Very subtle, 3% to 8% opacity
        scale: 0.5 + Math.random() * 1.5,
        rotation: Math.random() * 360,
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-emerald-300"
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            opacity: p.opacity,
            transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
            animation: `float ${p.duration}s ease-in-out infinite alternate`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.icon}
        </div>
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-20px) scale(1.05) rotate(5deg); }
          100% { transform: translateY(20px) scale(0.95) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}
