import { useStore } from "../../store/useStore";
import { Database, Search, Layout, Plus, MoreHorizontal } from "lucide-react";

export default function LeftSidebar() {
  const { tables, setTables, selectedTableId, setSelectedTableId } = useStore();

  const addTable = () => {
    const newTable = {
      id: `tbl_${Date.now()}`,
      name: `new_table_${tables.length + 1}`,
      position: { x: 200 + (tables.length * 20), y: 150 + (tables.length * 20) },
      columns: [
        { id: `col_${Date.now()}`, name: "_id", type: "ObjectId", isPK: true, isNotNull: true, isUnique: true, isAutoIncrement: false }
      ]
    };
    setTables([...tables, newTable]);
    setSelectedTableId(newTable.id);
  };

  return (
    <div className="w-64 shrink-0 bg-[rgba(10,10,20,0.4)] backdrop-blur-md border-r border-white/[0.05] flex flex-col z-20 font-sans">
      <div className="px-4 py-4 border-b border-white/[0.05]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tables..." 
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-sans"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 flex flex-col">
        <div className="px-4 mb-4">
          <button onClick={addTable} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all font-semibold text-xs shadow-lg shadow-emerald-500/5">
            <Plus className="w-3.5 h-3.5" />
            New Table
          </button>
        </div>

        <div className="px-4 mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tables</span>
        </div>
        
        <div className="space-y-0.5 px-2">
          {tables.map(table => {
            const isSelected = selectedTableId === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group ${
                  isSelected ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layout className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span className="truncate text-[13px] font-medium font-sans">{table.name}</span>
                </div>
                <MoreHorizontal className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
