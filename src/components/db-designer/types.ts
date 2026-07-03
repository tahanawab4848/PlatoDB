export interface DbColumn {
  id: string;
  name: string;
  type: string;
  isPK: boolean;
  isNotNull: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  isIndexed?: boolean;
}

export interface DbTable {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: DbColumn[];
}

export interface DbRelation {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: string;
}

export interface SchemaSnapshot {
  id: string;
  timestamp: string;
  message: string;
  tables: DbTable[];
  relations: DbRelation[];
}
