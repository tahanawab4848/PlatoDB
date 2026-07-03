import { useEffect, useRef } from "react";
import { Database, Sparkles, Brain, Code, Terminal, Bot, Network, Server } from "lucide-react";

export default function CursorTrail() {
  const trailRef = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const points = useRef(Array.from({ length: 10 }, () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })));
  const trailTarget = useRef(Array.from({ length: 10 }, () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })));
  const lastMouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMovingLerp = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.03;

      // Update the "head" of the trail target
      trailTarget.current[0].x += (mouse.current.x - trailTarget.current[0].x) * 0.5;
      trailTarget.current[0].y += (mouse.current.y - trailTarget.current[0].y) * 0.5;
      
      // Update the rest of the trail target
      for (let i = 1; i < points.current.length; i++) {
        trailTarget.current[i].x += (trailTarget.current[i - 1].x - trailTarget.current[i].x) * 0.4;
        trailTarget.current[i].y += (trailTarget.current[i - 1].y - trailTarget.current[i].y) * 0.4;
      }

      // Calculate mouse velocity
      const dx = mouse.current.x - lastMouse.current.x;
      const dy = mouse.current.y - lastMouse.current.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);
      
      lastMouse.current.x = mouse.current.x;
      lastMouse.current.y = mouse.current.y;

      // If moving sufficiently, state is 1 (trail). If static, state is 0 (orbit).
      const movingTarget = velocity > 0.5 ? 1 : 0;
      // Interpolate the state for smooth transition
      isMovingLerp.current += (movingTarget - isMovingLerp.current) * 0.08;

      for (let i = 0; i < points.current.length; i++) {
        // --- 1. TRAIL TARGET ---
        const waveX = Math.sin(time + i * 0.2) * 2;
        const waveY = Math.cos(time + i * 0.2) * 2;
        const targetTrailX = trailTarget.current[i].x + waveX;
        const targetTrailY = trailTarget.current[i].y + waveY;

        // --- 2. ORBIT TARGET ---
        const angleOffset = (i * (Math.PI * 2)) / points.current.length;
        const angle = time * 2 + angleOffset;
        const radius = 35 + Math.sin(time * 2 + i) * 5;
        const targetOrbitX = mouse.current.x + Math.cos(angle) * radius;
        const targetOrbitY = mouse.current.y + Math.sin(angle) * radius;

        // --- 3. BLEND TARGETS ---
        const targetX = targetOrbitX * (1 - isMovingLerp.current) + targetTrailX * isMovingLerp.current;
        const targetY = targetOrbitY * (1 - isMovingLerp.current) + targetTrailY * isMovingLerp.current;

        // Smoothly interpolate current point position to final target
        points.current[i].x += (targetX - points.current[i].x) * 0.15;
        points.current[i].y += (targetY - points.current[i].y) * 0.15;
        
        const el = trailRef.current[i];
        if (el) {
          const scale = 0.7 + Math.sin(time * 3 + i) * 0.15; 
          const opacity = 0.8;
          el.style.transform = `translate(${points.current[i].x - 12}px, ${points.current[i].y - 12}px) scale(${scale})`;
          el.style.opacity = opacity.toString();
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const icons = [
    <Database key="1" className="w-5 h-5" />,
    <Server key="2" className="w-5 h-5" />,
    <Sparkles key="3" className="w-5 h-5" />,
    <Brain key="4" className="w-5 h-5" />,
    <Bot key="5" className="w-5 h-5" />,
    <Network key="6" className="w-5 h-5" />,
    <Code key="7" className="w-5 h-5" />,
    <Terminal key="8" className="w-5 h-5" />,
    <span key="9" className="text-xl font-bold font-mono">{"{ }"}</span>,
    <span key="10" className="text-xl font-bold font-mono">{"< />"}</span>,
    <span key="11" className="text-xl font-bold font-mono">{"[ ]"}</span>,
    <span key="12" className="text-xl font-bold font-mono">#</span>,
    <span key="13" className="text-xl font-bold font-mono">;</span>
  ];

  const colors = [
    "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    "text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]",
    "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]",
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {points.current.map((_, i) => {
        // Shuffle the sequence so it looks random but is stable
        const iconIndex = (i * 7) % icons.length;
        const colorClass = colors[(i * 3) % colors.length];
        
        return (
          <div
            key={i}
            ref={(el) => {
              trailRef.current[i] = el;
            }}
            className={`absolute top-0 left-0 flex items-center justify-center ${colorClass} will-change-transform`}
            style={{ opacity: 0 }}
          >
            {icons[iconIndex]}
          </div>
        );
      })}
    </div>
  );
}
