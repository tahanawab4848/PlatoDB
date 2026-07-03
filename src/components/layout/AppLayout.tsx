import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Database, Home, Layout, History, Settings, Zap, Server, LogOut, User, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store/useStore";

export default function AppLayout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useStore();
  const navItems = [
    { name: "Dashboard", path: "/app/dashboard", icon: Home },
    { name: "AI Chat Wizard", path: "/app/setup", icon: MessageSquare },
    { name: "Visual Editor", path: "/app/designer", icon: Layout },
    { name: "Infrastructure Hub", path: "/app/infrastructure", icon: Server },
    { name: "Settings", path: "/app/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-transparent text-slate-200 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className={`${isExpanded ? "w-64" : "w-20"} shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col z-20 relative transition-all duration-300`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white z-50 transition-colors shadow-lg"
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <Link to="/" className={`p-6 flex items-center gap-3 border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${!isExpanded && "justify-center px-0"}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Database className="w-4 h-4 text-white" />
          </div>
          {isExpanded && <span className="text-xl font-bold tracking-tight text-white truncate">PlatoDB</span>}
        </Link>
        
        <div className={`flex-1 py-6 space-y-2 ${isExpanded ? "px-4" : "px-3"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                title={!isExpanded ? item.name : undefined}
                className={`flex items-center gap-3 py-3 rounded-xl transition-all ${isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"} ${isExpanded ? "px-4" : "px-0 justify-center"}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isExpanded && <span className="font-medium truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
        
        <div className={`p-4 border-t border-slate-800 ${!isExpanded && "flex flex-col items-center px-2"}`}>
          {isExpanded ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser?.name || "Architect"}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email || "architect@flowforge.com"}</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mb-3" title={currentUser?.name || "Architect"}>
              <User className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <button 
            title={!isExpanded ? "Sign out" : undefined}
            onClick={() => {
              setCurrentUser(null);
              navigate("/auth");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl text-sm font-semibold transition-colors ${isExpanded ? "w-full px-4" : "w-10 px-0"}`}
          >
            <LogOut className="w-4 h-4 shrink-0" /> {isExpanded && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
