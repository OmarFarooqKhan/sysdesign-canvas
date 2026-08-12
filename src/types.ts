export type EdgeMode = 'curved' | 'ortho';

/** Palette entry / minimal spec to spawn a node. */
export interface NodeDef {
  key: string;
  icon: string;
  label: string;
}

export interface GraphNode extends NodeDef {
  id: string;
  x: number;
  y: number;
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
