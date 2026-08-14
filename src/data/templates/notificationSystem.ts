import type { Tpl } from './types';

export const notifications: Tpl = {
  nodes: [
    { key: 'mobile', icon: 'mobile', label: 'Client App', x: 40, y: 240 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 206, y: 240 },
    { key: 'micro', icon: 'micro', label: 'Notification Service', x: 372, y: 240 },
    { key: 'config', icon: 'config', label: 'Template Store', x: 372, y: 106 },
    { key: 'nosql', icon: 'nosql', label: 'Preferences DB', x: 372, y: 508 },
    { key: 'queue', icon: 'queue', label: 'Notification Queue', x: 538, y: 106 },
    { key: 'worker', icon: 'worker', label: 'Push Worker', x: 538, y: 240 },
  ],
  edges: [
    [0, 1, 'send request'], [1, 2, ''], [2, 3, 'load template'],
    [2, 4, 'check prefs'], [2, 5, 'enqueue'], [5, 6, 'consume'], [6, 0, 'push notification'],
    [3, 5, 'render complete'],
  ],
  regions: [{ title: 'Notification Backend', x: 336, y: 70, w: 334, h: 538, color: '#f87171' }],
  walkthrough: [
    [0, "The client app calls the API to send a notification request — e.g. 'user X commented on your post' — specifying the recipient and event type."],
    [1, 'The API Gateway authenticates the caller and routes the request into the Notification Service, the single place that decides what to send and how.'],
    [2, 'The Notification Service looks up the right message template for this event type so it can render human-readable content instead of a raw event payload.'],
    [3, "The Template Store holds per-event, per-locale copy — push text, email HTML, SMS body — so the service renders 'Alice commented on your photo' instead of a hardcoded string. Once rendered, the service also checks the recipient's Preferences DB before this job is allowed to go out."],
    [5, "The rendered, preference-checked job is enqueued for asynchronous delivery — buffering here means a delivery spike (e.g. a viral post) can't overwhelm the push providers, and failed sends can be retried."],
    [6, 'The Push Worker dequeues the job and calls the platform-specific push service (APNs/FCM) to deliver the notification to the recipient\'s device, closing the loop back to the client app.'],
  ],
};
