import { ICONS } from '../data/icons';

/** Renders an inline SVG icon by name. */
export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }} />;
}
