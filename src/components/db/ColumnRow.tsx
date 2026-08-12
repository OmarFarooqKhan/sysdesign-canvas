import type { DbColumn } from '../../types';

/** One column's fields: name, type, primary-key flag, foreign-key target. */
export function ColumnRow({ column, onChange, onRemove }: {
  column: DbColumn;
  onChange: (fields: Partial<DbColumn>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="db-col-row">
      <input
        value={column.name}
        placeholder="Column"
        aria-label="Column name"
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <input
        value={column.type ?? ''}
        placeholder="Type"
        aria-label="Column type"
        onChange={(e) => onChange({ type: e.target.value || undefined })}
      />
      <label className="db-pk">
        <input
          type="checkbox"
          checked={!!column.pk}
          onChange={(e) => onChange({ pk: e.target.checked || undefined })}
        />
        PK
      </label>
      <input
        value={column.fk ?? ''}
        placeholder="FK (table.column)"
        aria-label="Foreign key target"
        onChange={(e) => onChange({ fk: e.target.value || undefined })}
      />
      <button type="button" aria-label="Remove column" onClick={onRemove}>×</button>
    </div>
  );
}
