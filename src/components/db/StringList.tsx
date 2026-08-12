import { useState } from 'react';
import { addListItem, removeListItem } from './dbModel';

/** Editable chip list for a table's indexes / constraints. */
export function StringList({ label, items, onChange }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const next = addListItem(items, draft);
    if (next !== items) { onChange(next); setDraft(''); }
  };

  return (
    <div className="db-list">
      <span className="db-list-label">{label}</span>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            {it}
            <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(removeListItem(items, i))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="db-list-add">
        <input
          value={draft}
          placeholder={`Add ${label.toLowerCase()}`}
          aria-label={`New ${label.toLowerCase()}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <button type="button" aria-label={`Add ${label.toLowerCase()}`} onClick={handleAdd}>+</button>
      </div>
    </div>
  );
}
