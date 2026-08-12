import { describe, expect, it } from 'vitest';
import {
  addColumn, addListItem, addTable, dbTableCount, emptyColumn, emptyTable,
  isDbNode, removeColumn, removeListItem, removeTable, updateColumn, updateTable,
} from '../../../components/db/dbModel';
import type { DbTable, GraphNode } from '../../../types';

describe('dbModel: node gating', () => {
  it('isDbNode is true only for SQL-database palette keys', () => {
    expect(isDbNode('sql')).toBe(true);
    expect(isDbNode('nosql')).toBe(false);
    expect(isDbNode('server')).toBe(false);
  });

  it('dbTableCount reads the table count off a node, defaulting to 0', () => {
    const base: GraphNode = { id: 'n1', key: 'sql', icon: 'sql', label: 'DB', x: 0, y: 0 };
    expect(dbTableCount(base)).toBe(0);
    expect(dbTableCount({ ...base, db: { tables: [] } })).toBe(0);
    expect(dbTableCount({ ...base, db: { tables: [emptyTable()] } })).toBe(1);
  });
});

describe('dbModel: table helpers', () => {
  it('emptyTable/emptyColumn create blank shapes', () => {
    expect(emptyTable()).toEqual({ name: '', columns: [], indexes: [], constraints: [] });
    expect(emptyColumn()).toEqual({ name: '' });
  });

  it('addTable appends a blank table without mutating the input', () => {
    const tables: DbTable[] = [];
    const out = addTable(tables);
    expect(out).toHaveLength(1);
    expect(tables).toHaveLength(0);
    expect(out[0]).toEqual(emptyTable());
  });

  it('removeTable removes by index, leaving others untouched', () => {
    const tables = [emptyTable(), { ...emptyTable(), name: 'B' }, { ...emptyTable(), name: 'C' }];
    const out = removeTable(tables, 1);
    expect(out.map((t) => t.name)).toEqual(['', 'C']);
  });

  it('updateTable merges fields into the table at the given index only', () => {
    const tables = [{ ...emptyTable(), name: 'A' }, { ...emptyTable(), name: 'B' }];
    const out = updateTable(tables, 0, { name: 'A2', shardKey: 'user_id' });
    expect(out[0]).toMatchObject({ name: 'A2', shardKey: 'user_id' });
    expect(out[1]).toMatchObject({ name: 'B' });
  });
});

describe('dbModel: column helpers', () => {
  it('addColumn appends a blank column without mutating the input table', () => {
    const table = emptyTable();
    const out = addColumn(table);
    expect(out.columns).toHaveLength(1);
    expect(table.columns).toHaveLength(0);
    expect(out.columns[0]).toEqual(emptyColumn());
  });

  it('removeColumn removes by index, leaving others untouched', () => {
    const table: DbTable = { ...emptyTable(), columns: [{ name: 'id' }, { name: 'email' }, { name: 'age' }] };
    const out = removeColumn(table, 1);
    expect(out.columns.map((c) => c.name)).toEqual(['id', 'age']);
  });

  it('updateColumn merges fields into the column at the given index only', () => {
    const table: DbTable = { ...emptyTable(), columns: [{ name: 'id' }, { name: 'email' }] };
    const out = updateColumn(table, 0, { type: 'uuid', pk: true, fk: 'users.id' });
    expect(out.columns[0]).toEqual({ name: 'id', type: 'uuid', pk: true, fk: 'users.id' });
    expect(out.columns[1]).toEqual({ name: 'email' });
  });
});

describe('dbModel: string list helpers', () => {
  it('addListItem trims and appends, ignoring blank/whitespace-only input', () => {
    expect(addListItem([], '  idx_email  ')).toEqual(['idx_email']);
    expect(addListItem(['a'], 'b')).toEqual(['a', 'b']);
    const same: string[] = ['a'];
    expect(addListItem(same, '   ')).toBe(same);
    expect(addListItem(same, '')).toBe(same);
  });

  it('removeListItem removes by index, leaving others untouched', () => {
    expect(removeListItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });
});
