import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { Plus, X, Type, Key, Hash, Settings2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TableEditorSidebar() {
  const { tables, relations, setTables, setRelations, selectedTableId, setSelectedTableId, updateTable } = useStore();
  const [isApplied, setIsApplied] = useState(false);
  const [localTable, setLocalTable] = useState<any>(null);
  
  const globalTable = tables.find(t => t.id === selectedTableId);
  
  useEffect(() => {
    if (globalTable) {
      setLocalTable(JSON.parse(JSON.stringify(globalTable)));
    } else {
      setLocalTable(null);
    }
  }, [selectedTableId]); // Only re-initialize when a different table is selected

  if (!selectedTableId || !localTable) return null;

  const addColumn = () => {
    setLocalTable((prev: any) => ({
      ...prev,
      columns: [...prev.columns, { id: `col_${Date.now()}`, name: "new_column", type: "String", isPK: false, isNotNull: false, isUnique: false, isAutoIncrement: false }]
    }));
  };

  const updateColumn = (colId: string, updates: any) => {
    setLocalTable((prev: any) => ({
      ...prev,
      columns: prev.columns.map((c: any) => c.id === colId ? { ...c, ...updates } : c)
    }));
  };

  const deleteColumn = (colId: string) => {
    setLocalTable((prev: any) => ({
      ...prev,
      columns: prev.columns.filter((c: any) => c.id !== colId)
    }));
  };

  const deleteTable = () => {
    if (!window.confirm("Are you sure you want to delete this entire table?")) return;
    setTables(tables.filter(t => t.id !== localTable.id));
    setRelations(relations.filter(r => r.fromTable !== localTable.id && r.toTable !== localTable.id));
    setSelectedTableId(null);
  };

  const handleApply = () => {
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
    updateTable(localTable.id, localTable);
  };

  return (
    <div className="w-80 shrink-0 bg-[rgba(10,10,20,0.4)] backdrop-blur-md border-l border-white/[0.05] flex flex-col z-20 font-sans">
      <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
        <h3 className="font-semibold text-[13px] text-slate-200 uppercase tracking-wide">Inspector</h3>
        <button onClick={() => setSelectedTableId(null)} className="p-1.5 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Table Configuration</label>
          <div className="bg-black/20 border border-white/[0.05] rounded-xl p-3">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input 
              value={localTable.name} 
              onChange={(e) => setLocalTable((prev: any) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Columns</label>
            <button onClick={addColumn} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              <Plus className="w-3 h-3"/> Add Column
            </button>
          </div>
          <div className="space-y-2">
            {localTable.columns.map((col: any) => (
              <div key={col.id} className="p-2.5 bg-black/20 rounded-xl border border-white/[0.05] space-y-2.5 group hover:border-white/[0.1] transition-colors">
                <div className="flex items-center gap-2">
                  <input 
                    value={col.name}
                    onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                    className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 px-1 py-1 text-[13px] font-medium text-slate-200 focus:outline-none transition-colors"
                  />
                  <select 
                    value={col.type} 
                    onChange={(e) => updateColumn(col.id, { type: e.target.value })}
                    className="bg-white/[0.05] border border-white/10 rounded-md text-[11px] font-mono text-slate-300 p-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="String" className="bg-slate-900">String</option>
                    <option value="Number" className="bg-slate-900">Number</option>
                    <option value="Boolean" className="bg-slate-900">Boolean</option>
                    <option value="Date" className="bg-slate-900">Date</option>
                    <option value="ObjectId" className="bg-slate-900">ObjectId</option>
                  </select>
                  <button onClick={() => deleteColumn(col.id)} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${col.isPK ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-black/30'}`}>
                      {col.isPK && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                    <input type="checkbox" checked={col.isPK} onChange={(e) => updateColumn(col.id, { isPK: e.target.checked })} className="hidden" /> 
                    Primary Key
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${col.isUnique ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-black/30'}`}>
                      {col.isUnique && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                    <input type="checkbox" checked={col.isUnique} onChange={(e) => updateColumn(col.id, { isUnique: e.target.checked })} className="hidden" /> 
                    Unique
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-white/[0.05] space-y-3">
           <button 
             onClick={handleApply} 
             className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${
               isApplied 
                 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                 : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
             }`}
           >
             {isApplied ? <><CheckCircle2 className="w-4 h-4" /> Changes Applied</> : "Apply to Canvas"}
           </button>
           
           <button onClick={deleteTable} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-xs font-bold">
             <AlertTriangle className="w-4 h-4" /> Delete Table
           </button>
        </div>
      </div>
    </div>
  );
}
