/** One row in the diagram library list: name + Load/Delete actions. */
export function LibraryRow({ name, onLoad, onDelete }: { name: string; onLoad: () => void; onDelete: () => void }) {
  return (
    <li className="library-row">
      <span className="library-row-name">{name}</span>
      <button type="button" onClick={onLoad}>Load</button>
      <button type="button" className="danger" onClick={onDelete}>Delete</button>
    </li>
  );
}
