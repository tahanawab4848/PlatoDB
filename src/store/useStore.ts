import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbTable, DbRelation, SchemaSnapshot } from '../components/db-designer/types';

interface AppState {
  tables: DbTable[];
  relations: DbRelation[];
  snapshots: SchemaSnapshot[];
  selectedTableId: string | null;
  currentProjectId: string | null;
  currentUser: any | null;
  setTables: (tables: DbTable[]) => void;
  setRelations: (relations: DbRelation[]) => void;
  addSnapshot: (snapshot: SchemaSnapshot) => void;
  setSnapshots: (snapshots: SchemaSnapshot[]) => void;
  setSelectedTableId: (id: string | null) => void;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentUser: (user: any | null) => void;
  updateTable: (id: string, updated: Partial<DbTable>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      tables: [
        {
          id: "tbl_users",
          name: "users",
          position: { x: 250, y: 150 },
          columns: [
            { id: "col_u1", name: "_id", type: "ObjectId", isPK: true, isNotNull: true, isUnique: true, isAutoIncrement: false },
            { id: "col_u2", name: "email", type: "String", isPK: false, isNotNull: true, isUnique: true, isAutoIncrement: false },
          ],
        }
      ],
      relations: [],
      snapshots: [],
      selectedTableId: null,
      currentProjectId: null,
      currentUser: null,
      setTables: (tables) => set({ tables }),
      setRelations: (relations) => set({ relations }),
      addSnapshot: (snapshot) => set((state) => ({ snapshots: [...state.snapshots, snapshot].slice(-10) })),
      setSnapshots: (snapshots) => set({ snapshots }),
      setSelectedTableId: (id) => set({ selectedTableId: id }),
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      setCurrentUser: (user) => set({ currentUser: user }),
      updateTable: (id, updated) => set((state) => ({
        tables: state.tables.map(t => t.id === id ? { ...t, ...updated } : t)
      })),
    }),
    {
      name: 'flowforge-storage',
    }
  )
);
