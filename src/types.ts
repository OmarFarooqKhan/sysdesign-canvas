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
  /** Free-text back-of-envelope annotation (QPS, storage estimates, etc). */
  notes?: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
  bidirectional?: boolean;
  /** Signed perpendicular offset applied at the path's midpoint, from dragging. */
  bend?: number;
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

/** One guided-playthrough step: the node it visits ("the section") plus free text.
 *  The hop into a step is resolved at render time from the existing edges — steps
 *  never store edge ids or geometry. */
export interface WalkStep {
  nodeId: string;
  text: string;
}

/** The undoable graph. `seq` is a monotonic id counter. */
export interface GraphState {
  nodes: Record<string, GraphNode>;
  edges: Edge[];
  regions: Region[];
  seq: number;
  /** Ordered guided-playthrough steps; optional so existing saves keep parsing. */
  walkthrough?: WalkStep[];
}

/** Serialized diagram (export / import / templates). */
export interface GraphData {
  edgeMode?: EdgeMode;
  nodes: GraphNode[];
  edges: Edge[];
  regions: Region[];
  walkthrough?: WalkStep[];
}
