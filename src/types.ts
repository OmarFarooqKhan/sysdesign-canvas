export type EdgeMode = 'curved' | 'ortho';

/** Palette entry / minimal spec to spawn a node. */
export interface NodeDef {
  key: string;
  icon: string;
  label: string;
}

export interface DbColumn {
  name: string;
  type?: string;
  pk?: boolean;
  fk?: string; // "table.column"
}

export interface DbTable {
  name: string;
  columns: DbColumn[];
  shardKey?: string;
  indexes: string[];
  constraints: string[];
}

export interface GraphNode extends NodeDef {
  id: string;
  x: number;
  y: number;
  db?: { tables: DbTable[] };
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
  bidirectional?: boolean;
}

export interface Region {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

/** The undoable graph. `seq` is a monotonic id counter. */
export interface GraphState {
  nodes: Record<string, GraphNode>;
  edges: Edge[];
  regions: Region[];
  seq: number;
}

/** Serialized diagram (export / import / templates). */
export interface GraphData {
  edgeMode?: EdgeMode;
  nodes: GraphNode[];
  edges: Edge[];
  regions: Region[];
}
