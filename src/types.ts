export type EdgeMode = 'curved' | 'ortho';

/** A palette entry / the minimal spec needed to spawn a node. */
export interface NodeDef {
  key: string;
  icon: string;
  label: string;
}

/** A node placed on the canvas. */
export interface GraphNode extends NodeDef {
  id: string;
  x: number;
  y: number;
  el: HTMLElement;
}

/** A directed connection between two nodes. */
export interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
  el: SVGPathElement;
  textEl: SVGTextElement;
}

/** A resizable group box drawn behind the nodes. */
export interface Region {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  el: HTMLElement;
}

/** Serialized diagram written by Export / read by Import. */
export interface GraphData {
  edgeMode?: EdgeMode;
  nodes: Array<Pick<GraphNode, 'id' | 'key' | 'icon' | 'label' | 'x' | 'y'>>;
  edges: Array<Pick<Edge, 'id' | 'from' | 'to' | 'label'>>;
  regions: Array<Pick<Region, 'id' | 'title' | 'x' | 'y' | 'w' | 'h' | 'color'>>;
}
