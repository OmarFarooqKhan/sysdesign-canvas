import { Fragment, useState } from 'react';
import { PALETTE } from '../data/palette';
import { Icon } from './Icon';

/** Left sidebar: draggable node-type palette, grouped by section. Collapsible; hidden entirely
 *  while presenting (`presenting` is optional/additive so existing callers are unaffected). */
export function Palette({ presenting = false }: { presenting?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  if (presenting) return null;

  return (
    <aside className={collapsed ? 'palette collapsed' : 'palette'}>
      <div className="palette-header">
        {!collapsed && <span className="palette-title">Components</span>}
        <button
          className="palette-toggle"
          aria-label={collapsed ? 'Expand palette' : 'Collapse palette'}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>
      {!collapsed && PALETTE.map((section) => (
        <Fragment key={section.group}>
          <h2>{section.group}</h2>
          {section.items.map((item) => (
            <div
              key={item.key}
              className="pal-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify(item))}
            >
              <Icon name={item.icon} className="ico" />
              <span>{item.label}</span>
            </div>
          ))}
        </Fragment>
      ))}
    </aside>
  );
}
