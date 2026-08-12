import type { DbTable } from '../../types';
import { addColumn, removeColumn, updateColumn } from './dbModel';
import { ColumnRow } from './ColumnRow';
import { StringList } from './StringList';

/** One table's fields: name, shard key, columns, indexes, constraints. */
export function TableEditor({ table, onChange, onRemove }: {
  table: DbTable;
  onChange: (table: DbTable) => void;
  onRemove: () => void;
}) {
  return (
    <div className="db-table">
      <div className="db-table-head">
        <input
          value={table.name}
          placeholder="Table name"
          aria-label="Table name"
          onChange={(e) => onChange({ ...table, name: e.target.value })}
        />
        <input
          value={table.shardKey ?? ''}
          placeholder="Shard key"
          aria-label="Shard key"
          onChange={(e) => onChange({ ...table, shardKey: e.target.value || undefined })}
        />
        <button type="button" className="danger" onClick={onRemove}>Remove table</button>
      </div>
      {table.columns.map((c, i) => (
        <ColumnRow
          key={i}
          column={c}
          onChange={(fields) => onChange(updateColumn(table, i, fields))}
          onRemove={() => onChange(removeColumn(table, i))}
        />
      ))}
      <button type="button" onClick={() => onChange(addColumn(table))}>+ Column</button>
      <StringList label="Indexes" items={table.indexes} onChange={(indexes) => onChange({ ...table, indexes })} />
      <StringList
        label="Constraints"
        items={table.constraints}
        onChange={(constraints) => onChange({ ...table, constraints })}
      />
    </div>
  );
}
