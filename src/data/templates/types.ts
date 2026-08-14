import type { Region } from '../../types';

export interface TplNode { key: string; icon: string; label: string; x: number; y: number; }

/** Template shape: nodes + `[fromIndex, toIndex, label]` edge tuples + regions (ids generated later). */
export interface Tpl {
  nodes: TplNode[];
  edges: Array<[number, number, string]>;
  regions: Array<Omit<Region, 'id'>>;
  /** Optional guided-playthrough steps, authored as `[nodeIndex, text]` tuples
   *  (mirrors the `edges` index convention). Resolved to real node ids by
   *  `templateToData`. Omit entirely for templates with no playthrough. */
  walkthrough?: Array<[number, string]>;
}
