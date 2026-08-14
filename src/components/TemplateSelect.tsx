import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { TEMPLATE_OPTIONS, templateToData, type TemplateKey } from '../data/templates';

/** The Templates… dropdown: loads a starter diagram, confirming first (via the
 *  parent's request fn) when it would replace a non-empty canvas. Split out of
 *  Toolbar.tsx to keep it under the line cap. */
export function TemplateSelect({ disabled, request }: {
  disabled: boolean;
  request: (message: string, run: () => void) => void;
}) {
  const { state, dispatch } = useGraph();
  const { setEdgeMode } = useUI();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as TemplateKey | '';
    e.target.value = '';
    if (!key) return;
    const load = () => {
      dispatch({ type: 'LOAD', data: templateToData(key) });
      setEdgeMode('curved');
    };
    if (Object.keys(state.nodes).length === 0) return load();
    request('Replace the current canvas with this template?', load);
  };

  return (
    <select defaultValue="" onChange={handleChange} aria-label="Templates" disabled={disabled}>
      <option value="">Templates…</option>
      {TEMPLATE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
    </select>
  );
}
