import type { Tpl } from './types';

export const rideSharing: Tpl = {
  nodes: [
    { key: 'mobile', icon: 'mobile', label: 'Rider App', x: 40, y: 106 },
    { key: 'mobile', icon: 'mobile', label: 'Driver App', x: 40, y: 374 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 206, y: 240 },
    { key: 'micro', icon: 'micro', label: 'Matching Service', x: 372, y: 240 },
    { key: 'cache', icon: 'cache', label: 'Driver Location Cache', x: 372, y: 106 },
    { key: 'sql', icon: 'sql', label: 'Trips DB', x: 538, y: 240 },
    { key: 'worker', icon: 'worker', label: 'Pricing Worker', x: 538, y: 106 },
  ],
  edges: [
    [0, 2, 'request ride'], [1, 2, 'location ping'], [2, 3, 'match'],
    [3, 4, 'nearby drivers'], [3, 5, 'create trip'], [3, 6, 'estimate fare'],
    [4, 6, 'estimate fare for match'], [6, 5, 'create trip w/ fare'],
  ],
  regions: [{ title: 'Matching Backend', x: 336, y: 70, w: 334, h: 270, color: '#4f8cff' }],
  walkthrough: [
    [0, 'The rider opens the app and requests a ride, specifying pickup and destination — this kicks off the flow that finds, prices, and books a nearby driver.'],
    [2, 'The API Gateway authenticates the request and routes it to the Matching Service; the same gateway also receives a steady stream of location pings from driver apps, which feed the cache used next.'],
    [3, "The Matching Service takes the rider's pickup point and looks for available drivers close enough to serve the trip within the target ETA."],
    [4, "The Driver Location Cache holds each active driver's most recent GPS ping in a geospatial index, so nearby-driver lookups are a fast in-memory query instead of a table scan."],
    [6, 'Once a driver is matched, the Pricing Worker computes a fare estimate from trip distance, time, and current demand (surge pricing) before the trip is confirmed.'],
    [5, 'The Trips DB persists the new trip record — rider, driver, route, and fare — as the durable booking both apps poll or subscribe to for live status updates.'],
  ],
};
