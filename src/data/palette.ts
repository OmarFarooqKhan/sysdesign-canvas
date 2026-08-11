import type { NodeDef } from '../types';

export interface PaletteSection {
  group: string;
  items: NodeDef[];
}

export const PALETTE: PaletteSection[] = [
  { group: 'Clients', items: [
    { key: 'browser', label: 'Web Client', icon: 'browser' },
    { key: 'mobile', label: 'Mobile App', icon: 'mobile' },
    { key: 'client', label: 'Desktop', icon: 'client' },
    { key: 'external', label: '3rd-party API', icon: 'external' },
  ] },
  { group: 'Edge / Routing', items: [
    { key: 'dns', label: 'DNS', icon: 'dns' },
    { key: 'cdn', label: 'CDN', icon: 'cdn' },
    { key: 'lb', label: 'Load Balancer', icon: 'lb' },
    { key: 'gateway', label: 'API Gateway', icon: 'gateway' },
    { key: 'auth', label: 'Auth Service', icon: 'auth' },
  ] },
  { group: 'Compute', items: [
    { key: 'server', label: 'App Server', icon: 'server' },
    { key: 'micro', label: 'Microservice', icon: 'micro' },
    { key: 'worker', label: 'Worker', icon: 'worker' },
    { key: 'scheduler', label: 'Scheduler', icon: 'scheduler' },
  ] },
  { group: 'Data', items: [
    { key: 'sql', label: 'SQL DB', icon: 'sql' },
    { key: 'nosql', label: 'NoSQL DB', icon: 'nosql' },
    { key: 'cache', label: 'Cache', icon: 'cache' },
    { key: 'blob', label: 'Object Store', icon: 'blob' },
    { key: 'search', label: 'Search Index', icon: 'search' },
  ] },
  { group: 'Async / Ops', items: [
    { key: 'queue', label: 'Message Queue', icon: 'queue' },
    { key: 'stream', label: 'Event Stream', icon: 'stream' },
    { key: 'config', label: 'Config / Registry', icon: 'config' },
    { key: 'monitor', label: 'Monitoring', icon: 'monitor' },
  ] },
];
