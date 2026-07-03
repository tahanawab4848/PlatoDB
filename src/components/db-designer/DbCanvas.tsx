import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Key } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DbTable, DbRelation } from './types';

// ── Table Node Component ─────────────────────────────────────
function TableNode({ data, selected }: { data: any; selected?: boolean }) {
  // Give each table a consistent subtle color hint based on its name length
  const colors = ["from-emerald-500/20 to-green-500/10", "from-emerald-500/20 to-teal-500/10", "from-teal-500/20 to-rose-500/10", "from-blue-500/20 to-cyan-500/10"];
  const colorClass = colors[data.table.name.length % colors.length];
  const glowColor = ["rgba(16,185,129,0.5)", "rgba(16,185,129,0.5)", "rgba(20,184,166,0.5)", "rgba(59,130,246,0.5)"][data.table.name.length % colors.length];

  return (
    <div className={`min-w-[280px] rounded-2xl overflow-hidden transition-all duration-300 ${
      selected
        ? 'ring-1 ring-white/30 scale-[1.02] z-50'
        : 'ring-1 ring-white/10 hover:ring-white/20'
    }`}
    style={{
      background: "rgba(10, 10, 20, 0.75)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: selected ? `0 0 40px ${glowColor}, 0 20px 40px rgba(0,0,0,0.5)` : '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div className={`px-5 py-3.5 flex items-center justify-between bg-gradient-to-r ${colorClass} border-b border-white/[0.08]`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${selected ? 'animate-pulse' : ''}`} style={{ background: glowColor.replace('0.5', '1'), boxShadow: `0 0 10px ${glowColor.replace('0.5', '1')}` }} />
          <span className="font-display font-bold text-[15px] text-white tracking-wide">{data.table.name}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-black/20 px-2 py-0.5 rounded-full">{data.table.columns.length} cols</span>
      </div>
      <div className="divide-y divide-white/[0.04] p-1">
        {data.table.columns.map((col: any) => (
          <div key={col.id} className="relative flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.04] rounded-lg transition-colors group cursor-pointer">
            <Handle
              type="target"
              position={Position.Left}
              id={`t-${col.id}`}
              className="!w-3 !h-3 !bg-slate-700 group-hover:!bg-emerald-400 !border-2 !border-slate-900 transition-colors opacity-0 group-hover:opacity-100"
            />
            <div className="flex items-center gap-2.5 min-w-0">
              {col.isPK
                ? <Key className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 ml-1" />
              }
              <span className="text-[13px] text-slate-300 truncate group-hover:text-white transition-colors font-medium">{col.name}</span>
              {col.isUnique && <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded font-mono font-bold">UQ</span>}
            </div>
            <span className="text-[11px] font-mono text-slate-500 ml-3 shrink-0">{col.type}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`s-${col.id}`}
              className="!w-3 !h-3 !bg-slate-700 group-hover:!bg-emerald-400 !border-2 !border-slate-900 transition-colors opacity-0 group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Canvas ──────────────────────────────────────────────
export default function DbCanvas() {
  const { tables, relations, setTables, setRelations, setSelectedTableId } = useStore();

  const nodeTypes = useMemo(() => ({ tableNode: TableNode }), []);

  const initialNodes: Node[] = tables.map((t: DbTable) => ({
    id: t.id,
    type: 'tableNode',
    position: t.position,
    data: { table: t },
  }));

  const initialEdges: Edge[] = relations.map((r: DbRelation) => ({
    id: r.id,
    source: r.fromTable,
    sourceHandle: `s-${r.fromColumn}`,
    target: r.toTable,
    targetHandle: `t-${r.toColumn}`,
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync from Zustand store to React Flow (when Inspector or AI makes changes)
  useEffect(() => {
    setNodes((nds) => {
      return tables.map((t: DbTable) => {
        const existingNode = nds.find(n => n.id === t.id);
        return {
          id: t.id,
          type: 'tableNode',
          position: t.position,
          data: { table: t },
          selected: existingNode?.selected || false,
        };
      });
    });
  }, [tables, setNodes]);

  useEffect(() => {
    setEdges(relations.map((r: DbRelation) => ({
      id: r.id,
      source: r.fromTable,
      sourceHandle: `s-${r.fromColumn}`,
      target: r.toTable,
      targetHandle: `t-${r.toColumn}`,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
    })));
  }, [relations, setEdges]);

  // Sync node positions back to Zustand when dragged
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position);
    if (positionChanges.length > 0) {
      const updated = tables.map(t => {
        const change = positionChanges.find((c: any) => c.id === t.id);
        return change ? { ...t, position: change.position } : t;
      });
      setTables(updated);
    }
  }, [onNodesChange, tables, setTables]);

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: any) => {
    setSelectedTableId(selectedNodes.length > 0 ? selectedNodes[0].id : null);
  }, [setSelectedTableId]);

  return (
    <div className="w-full h-full bg-transparent">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        attributionPosition="bottom-right"
      >
        <Background
          color="rgba(255,255,255,0.05)"
          gap={32}
          size={1.5}
        />
        <MiniMap 
          className="!bg-[#012b3d]/80 !backdrop-blur-xl !border-white/10 !rounded-xl overflow-hidden shadow-2xl"
          maskColor="rgba(0,0,0,0.4)"
          nodeColor="rgba(16,185,129,0.5)"
          position="bottom-right"
        />
        <Controls className="!bg-[#012b3d]/80 !backdrop-blur-xl !border-white/10 !rounded-lg !fill-white shadow-2xl" />
      </ReactFlow>
    </div>
  );
}
