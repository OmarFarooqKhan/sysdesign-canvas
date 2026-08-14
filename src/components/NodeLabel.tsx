import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { textOf } from '../lib/dom';

/** The node's caption: double-click to edit in place, Enter/blur commits the
 *  rename. Split out of NodeView.tsx to keep it under the line cap. */
export function NodeLabel({ node }: { node: GraphNode }) {
  const { dispatch } = useGraph();
  const labelRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const onBlur = () => {
    setEditing(false);
    dispatch({ type: 'RENAME_NODE', id: node.id, label: textOf(labelRef.current) });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); labelRef.current?.blur(); }
  };

  return (
    <div
      ref={labelRef}
      className="label"
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={() => setEditing(true)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >{node.label}</div>
  );
}
