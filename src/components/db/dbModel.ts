import type { DbColumn, DbTable, GraphNode } from '../../types';

/** Palette keys that represent a SQL/relational database (see data/palette.ts). */
export const DB_NODE_KEYS = new Set(['sql']);

export const isDbNode = (key: string): boolean => DB_NODE_KEYS.has(key);

/** Number of DB tables recorded on a node (0 when it has no db data). */
export const dbTableCount = (node: GraphNode): number => node.db?.tables.length ?? 0;

export const emptyColumn = (): DbColumn => ({ name: '' });

export const emptyTable = (): DbTable => ({ name: '', columns: [], indexes: [], constraints: [] });

export const addTable = (tables: DbTable[]): DbTable[] => [...tables, emptyTable()];

export const removeTable = (tables: DbTable[], i: number): DbTable[] =>
  tables.filter((_, idx) => idx !== i);

export const updateTable = (tables: DbTable[], i: number, fields: Partial<DbTable>): DbTable[] =>
  tables.map((t, idx) => (idx === i ? { ...t, ...fields } : t));

export const addColumn = (table: DbTable): DbTable => ({
  ...table,
  columns: [...table.columns, emptyColumn()],
});

export const removeColumn = (table: DbTable, i: number): DbTable => ({
  ...table,
  columns: table.columns.filter((_, idx) => idx !== i),
});

export const updateColumn = (table: DbTable, i: number, fields: Partial<DbColumn>): DbTable => ({
  ...table,
  columns: table.columns.map((c, idx) => (idx === i ? { ...c, ...fields } : c)),
});

export const addListItem = (list: string[], value: string): string[] => {
  const v = value.trim();
  return v ? [...list, v] : list;
};

export const removeListItem = (list: string[], i: number): string[] =>
  list.filter((_, idx) => idx !== i);
