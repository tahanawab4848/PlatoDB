import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Download, Zap, Sparkles, Save, Users, Code, Flame, MessageSquare, FileText, BookOpen } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import mermaid from "mermaid";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DbCanvas from "../components/db-designer/DbCanvas";
import OutputPanel from "../components/db-designer/OutputPanel";
import AiCopilot from "../components/db-designer/AiCopilot";
import AiCTO from "../components/db-designer/AiCTO";
import TableEditorSidebar from "../components/db-designer/TableEditorSidebar";
import LeftSidebar from "../components/db-designer/LeftSidebar";
import { useStore } from "../store/useStore";
import { io, Socket } from "socket.io-client";

export default function DbDesignerPage() {
  const { tables, relations, setTables, setRelations, addSnapshot, snapshots, currentProjectId, currentUser } = useStore();
  const [copilotOpen, setCopilotOpen] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  useEffect(() => {
    try {
      const newSocket = io("http://localhost:5000", { timeout: 3000, reconnectionAttempts: 2 });
      newSocket.on("connect_error", () => setIsMultiplayer(false));
      newSocket.on("cursor-move", (data) => setCursors(prev => ({ ...prev, [data.id]: { x: data.x, y: data.y } })));
      
      // Prevent infinite loop by not updating our own state if the update came from us
      newSocket.on("schema-update", (data) => { 
        if (data.senderId !== newSocket.id) {
          setTables(data.tables); 
          setRelations(data.relations); 
        }
      });
      
      newSocket.on("user-disconnected", (id) => setCursors(prev => { const next = { ...prev }; delete next[id]; return next; }));
      setSocket(newSocket);
      return () => { newSocket.close(); };
    } catch { /* backend offline */ }
  }, [setTables, setRelations]);

  // Broadcast schema changes to other users
  useEffect(() => {
    if (socket && isMultiplayer) {
      socket.emit("schema-update", { tables, relations, senderId: socket.id });
    }
  }, [tables, relations, socket, isMultiplayer]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (socket && isMultiplayer) socket.emit("cursor-move", { x: e.clientX, y: e.clientY });
  };

  const saveSnapshot = async () => {
    const snapMsg = `Snapshot ${snapshots.length + 1}`;
    
    // Save locally
    addSnapshot({ 
      id: `snap_${Date.now()}`, 
      timestamp: new Date().toISOString(), 
      message: snapMsg, 
      tables: JSON.parse(JSON.stringify(tables)), 
      relations: JSON.parse(JSON.stringify(relations)) 
    });

    // If we have an active project, persist it to the backend DB
    if (currentProjectId) {
      try {
        await fetch(`/api/projects/${currentProjectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tables, relations, snapshotMessage: snapMsg })
        });
      } catch (err) {
        console.error("Failed to save to backend DB", err);
      }
    }
  };

  const exportPDF = async () => {
    try {
      // 1. Generate Mermaid ERD String
      let md = `erDiagram\n`;
      tables.forEach(t => {
        md += `  ${t.name} {\n`;
        t.columns.forEach(c => {
          // ensure no spaces in type
          const cleanType = c.type.replace(/\s+/g, '');
          md += `    ${cleanType} ${c.name} ${c.isPK ? 'PK' : ''}\n`;
        });
        md += `  }\n`;
      });
      relations.forEach(r => {
        md += `  ${r.fromTable} ||--o{ ${r.toTable} : "${r.fromColumn}"\n`;
      });

      // 2. Render to SVG
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      const { svg } = await mermaid.render('mermaid-erd-export', md);

      if (tables.length === 0) {
        throw new Error("No tables available to generate the ERD. Please design a database schema first.");
      }

      // Extract viewBox to ensure we use exact dimensions (prevents clipping)
      const match = svg.match(/viewBox="([^"]+)"/);
      let svgWidth = 1000, svgHeight = 800;
      if (match) {
        const parts = match[1].trim().split(/\s+/);
        svgWidth = parseFloat(parts[2]);
        svgHeight = parseFloat(parts[3]);
      }

      // Force explicit width/height into SVG so the Image element doesn't crop it
      // Remove existing to prevent XML duplication
      let cleanSvg = svg.replace(/width="[^"]+"/, '').replace(/height="[^"]+"/, '');
      const fixedSvg = cleanSvg.replace(/<svg([^>]*)>/, `<svg$1 width="${svgWidth}" height="${svgHeight}">`);

      // 3. Convert SVG to high-res PNG via Canvas
      const svg64 = btoa(unescape(encodeURIComponent(fixedSvg)));
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;

      const img = new Image();
      img.src = image64;
      await new Promise((resolve, reject) => { 
        img.onload = resolve;
        img.onerror = reject;
      });

      // Scale up for retina quality
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff'; // White background for PDF ensures dark lines are visible
      ctx.fillRect(0, 0, svgWidth, svgHeight);
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // 4. Generate PDF
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;

      // Fetch project name if possible
      let defaultName = "Database";
      if (currentProjectId) {
        try {
          const res = await fetch(`/api/project/${currentProjectId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.name && data.name !== "New Database Project" && data.name !== "AI Generated Project") {
              defaultName = data.name;
            }
          }
        } catch (e) {
          console.error("Could not fetch project name for PDF", e);
        }
      }

      const userInputName = window.prompt("Enter a project name for the ERD Document:", defaultName);
      if (userInputName === null) return; // User cancelled
      const finalProjectName = userInputName.trim() || defaultName;

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text(`${finalProjectName} Architecture ERD`, margin, margin + 20);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated by PlatoDB AI • ${new Date().toLocaleString()}`, margin, margin + 40);

      // Image
      const imgProps = pdf.getImageProperties(dataUrl);
      const availableWidth = pageWidth - (margin * 2);
      const scaledHeight = (imgProps.height * availableWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', margin, margin + 60, availableWidth, scaledHeight);

      // Schema Breakdown
      let currentY = margin + 60 + scaledHeight + 40;
      
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = margin + 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Schema Dictionary", margin, currentY);
      
      currentY += 30;
      pdf.setFontSize(10);

      tables.forEach((t) => {
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin + 20;
        }
        
        pdf.setFont("helvetica", "bold");
        pdf.text(t.name.toUpperCase(), margin, currentY);
        
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(80, 80, 80);
        const colString = t.columns.map(c => `${c.name} [${c.type}]${c.isPK ? ' (PK)' : ''}`).join(',  ');
        
        // Wrap text
        const lines = pdf.splitTextToSize(colString, availableWidth - 120);
        pdf.text(lines, margin + 120, currentY);
        
        currentY += (lines.length * 15) + 10;
      });

      // --- EXTENSIVE ARCHITECTURAL STUDY GUIDE ---
      
      pdf.addPage();
      currentY = margin + 20;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Architectural Study Guide", margin, currentY);
      
      currentY += 30;
      pdf.setFontSize(14);
      pdf.text("1. Data Normalization Review", margin, currentY);
      
      currentY += 20;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const normText = "Normalization is the process of organizing data to reduce redundancy and improve data integrity. In this schema, we aim for Third Normal Form (3NF). This ensures that every non-primary-key attribute is dependent on the primary key, the whole primary key, and nothing but the primary key. This architectural decision prevents insertion, update, and deletion anomalies when the system scales.";
      const normLines = pdf.splitTextToSize(normText, availableWidth);
      pdf.text(normLines, margin, currentY);
      currentY += (normLines.length * 15) + 30;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("2. Time Complexity & Indexing (Big O)", margin, currentY);

      currentY += 20;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const indexText = "Without proper indexing, searching this database requires a Full Table Scan, resulting in O(N) time complexity where N is the number of rows. By enforcing primary keys and creating B-Tree indexes on frequently queried columns (like foreign keys or email addresses), the database can locate records in O(log N) time, ensuring exponential scalability as traffic grows.";
      const indexLines = pdf.splitTextToSize(indexText, availableWidth);
      pdf.text(indexLines, margin, currentY);
      currentY += (indexLines.length * 15) + 30;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("3. Relational vs Non-Relational Trade-offs", margin, currentY);

      currentY += 20;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const tradeText = "This schema defines explicit relationships between entities. In a strict relational database (SQL), these relationships enforce Referential Integrity at the database level. In a document database (like MongoDB/Mongoose), these references often require Application-Level joins (e.g., .populate()). Understanding this distinction is crucial for deciding between strict ACID compliance and horizontal scalability.";
      const tradeLines = pdf.splitTextToSize(tradeText, availableWidth);
      pdf.text(tradeLines, margin, currentY);
      currentY += (tradeLines.length * 15) + 40;

      // Footer: Architect Details & Links
      if (currentY > pageHeight - 150) {
        pdf.addPage();
        currentY = margin + 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Architect Details", margin, currentY);
      
      currentY += 20;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Name: ${currentUser?.name || 'Taha Nawab'}`, margin, currentY);
      currentY += 15;
      pdf.text(`Email: ${currentUser?.email || 'tahanawab4848@gmail.com'}`, margin, currentY);
      
      currentY += 25;
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Connect & Portfolio", margin, currentY);
      
      currentY += 20;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 102, 204);
      pdf.text("LinkedIn: https://www.linkedin.com/in/tahanawab4848", margin, currentY);
      currentY += 15;
      pdf.text("Portfolio: https://taha-nawab-portfolio.vercel.app/", margin, currentY);
      currentY += 15;
      pdf.text("GitHub: https://www.github.com/tahanawab4848", margin, currentY);

      pdf.save(`${finalProjectName.replace(/\s+/g, '-')}-ERD-${Date.now()}.pdf`);
    } catch (e: any) {
      console.error("PDF Export failed:", e);
      alert(`Failed to export PDF: ${e?.message || 'Check console for details.'}`);
    }
  };

  return (
    <div className="relative h-full bg-transparent text-slate-200 overflow-hidden flex flex-col" onPointerMove={handlePointerMove}>
      {/* Multiplayer cursors */}
      {isMultiplayer && Object.entries(cursors).map(([id, pos]) => (
        <motion.div key={id} className="absolute z-50 pointer-events-none flex flex-col items-start" animate={{ x: pos.x, y: pos.y }} transition={{ type: "tween", ease: "linear", duration: 0.05 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981" stroke="#fff" strokeWidth="2"><path d="M5.65 2.15l15.19 14.5a1 1 0 01-.65 1.73H13L10.3 25.1a.5.5 0 01-.9.08L5 18H2.5a1 1 0 01-.68-1.74l3.83-14.11z" /></svg>
          <div className="bg-emerald-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ml-3 shadow-lg">{id.slice(0, 4)}</div>
        </motion.div>
      ))}

      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-5 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/app/dashboard" className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 leading-tight">Database Designer</h1>
              <p className="text-[10px] text-slate-500">AI-powered schema builder</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsMultiplayer(!isMultiplayer)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMultiplayer ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800"}`}>
            <Users className="w-3.5 h-3.5" /> {isMultiplayer ? "Live" : "Multiplayer"}
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
            <FileText className="w-3.5 h-3.5" /> PDF ERD
          </button>
          <button onClick={saveSnapshot} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
            <Save className="w-3.5 h-3.5" /> Commit
          </button>
          <Link to="/app/setup" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> AI Wizard
          </Link>
          <button onClick={() => setCopilotOpen(!copilotOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${copilotOpen ? "bg-emerald-600 text-white" : "text-emerald-200 bg-emerald-600/80 hover:bg-emerald-500"}`}>
            <Sparkles className="w-3.5 h-3.5" /> AI Co-Pilot
          </button>
          
          <div className="w-px h-6 bg-slate-800 mx-2" />
          
          <Link to="/app/learning-lab" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-rose-600 hover:from-teal-500 hover:to-rose-500 transition-all shadow-lg shadow-teal-500/20">
            <BookOpen className="w-3.5 h-3.5" /> CS Learning Lab
          </Link>

          <Link to="/app/infrastructure" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg shadow-emerald-500/20">
            <Zap className="w-3.5 h-3.5" /> Infrastructure Hub
          </Link>
        </div>
      </header>

      {/* Main IDE Layout */}
      <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          
          <div className="flex-1 relative">
            <DbCanvas />
          </div>

          <TableEditorSidebar />
        </div>
        
        <AiCTO />
      </div>

      <AiCopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
