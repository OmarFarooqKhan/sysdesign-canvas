import type { Tpl } from './types';

export const chat: Tpl = {
  nodes: [
    { key: 'mobile', icon: 'mobile', label: 'Mobile', x: 40, y: 240 },
    { key: 'gateway', icon: 'gateway', label: 'WS Gateway', x: 206, y: 240 },
    { key: 'micro', icon: 'micro', label: 'Chat Service', x: 372, y: 240 },
    { key: 'queue', icon: 'queue', label: 'Msg Queue', x: 372, y: 106 },
    { key: 'nosql', icon: 'nosql', label: 'Messages DB', x: 538, y: 240 },
    { key: 'worker', icon: 'worker', label: 'Push Worker', x: 538, y: 106 },
  ],
  edges: [[0, 1, 'WebSocket'], [1, 2, ''], [2, 3, 'publish'], [3, 5, 'consume'], [2, 4, 'store']],
  regions: [{ title: 'Realtime Backend', x: 336, y: 70, w: 334, h: 270, color: '#a78bfa' }],
  walkthrough: [
    [0, 'The mobile client opens a persistent WebSocket connection so it can send and receive messages in real time without the overhead of repeated HTTP polling.'],
    [1, 'The WS Gateway terminates the WebSocket, authenticates the session, and forwards the inbound message to the Chat Service over an internal call.'],
    [2, 'The Chat Service validates the message, writes it to the Messages DB for durability, and publishes an event onto the queue so delivery can happen asynchronously.'],
    [3, "The message queue decouples ingestion from delivery — it buffers the publish event so a burst of messages doesn't overwhelm the push delivery path downstream."],
    [5, "The Push Worker consumes events off the queue and delivers the message to the recipient's other connected devices via APNs/FCM or a live WebSocket push."],
  ],
};
