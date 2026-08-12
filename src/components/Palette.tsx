import { Fragment } from 'react';
import { PALETTE } from '../data/palette';
import { Icon } from './Icon';

/** Left sidebar: draggable node-type palette, grouped by section. */
export function Palette() {
  return (
    <aside className="palette">
      {PALETTE.map((section) => (
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
