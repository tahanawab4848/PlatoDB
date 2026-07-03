import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Folder, Clock, Users, MoreVertical, Loader2, BookOpen, ArrowRight } from "lucide-react";
import { useStore } from "../store/useStore";

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { setCurrentProjectId, setTables, setRelations, setSnapshots, currentUser } = useStore();

  const userId = currentUser?.id || "u1";

  useEffect(() => {
    fetch(`/api/projects/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load projects", err);
        setLoading(false);
      });
  }, []);

  const handleCreateProject = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: "New Database Project" })
      });
      const newProj = await res.json();
      
      // Load into store
      setCurrentProjectId(newProj.id);
      setTables(newProj.tables || []);
      setRelations(newProj.relations || []);
      setSnapshots(newProj.history || []);
      
      // Navigate to chat wizard to start building
      navigate("/app/setup");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const loadProject = async (proj: any) => {
    setCurrentProjectId(proj.id);
    setTables(proj.tables || []);
    setRelations(proj.relations || []);
    setSnapshots(proj.history || []);
    navigate("/app/designer");
  };

  return (
    <div className="flex-1 overflow-auto bg-[#030303] p-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {currentUser?.name || "Architect"}</h1>
          <p className="text-slate-400 text-sm">Here's what's happening with your database schemas today.</p>
        </div>
        <button onClick={handleCreateProject} disabled={creating} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50">
          {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} New Project
        </button>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Quick Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-emerald-400 font-bold">EC</span>
          </div>
          <h3 className="text-white font-medium mb-1">E-Commerce Template</h3>
          <p className="text-slate-400 text-sm">Users, Products, Orders, Reviews</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-teal-400 font-bold">SO</span>
          </div>
          <h3 className="text-white font-medium mb-1">Social Media App</h3>
          <p className="text-slate-400 text-sm">Users, Posts, Comments, Follows</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-cyan-400 font-bold">SA</span>
          </div>
          <h3 className="text-white font-medium mb-1">B2B SaaS</h3>
          <p className="text-slate-400 text-sm">Organizations, Subscriptions, Roles</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-white mb-4">Learning Tools</h2>
      <div className="grid grid-cols-1 mb-12">
        <Link to="/app/learning-lab" className="p-6 rounded-2xl bg-gradient-to-r from-[#001e2b] to-[#012534] border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-between cursor-pointer transition-colors group">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
               <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                CS Learning Lab 
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-wider border border-emerald-500/30">AI Professor</span>
              </h3>
              <p className="text-slate-400 text-sm">Run dynamic Normalization, Big O Time Complexity, and CAP Theorem analysis on your active project.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Recent Projects</h2>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No projects found. Create a new one!
          </div>
        ) : (
          projects.map((proj, i) => (
            <div key={proj.id} className={`flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors ${i !== projects.length - 1 ? 'border-b border-slate-800' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <button onClick={() => loadProject(proj)} className="text-white font-medium hover:text-emerald-400 transition-colors text-left">{proj.name}</button>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(proj.updatedAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {proj.history?.length || 0} Snapshots</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
