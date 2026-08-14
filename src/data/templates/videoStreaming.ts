import type { Tpl } from './types';

export const videoStreaming: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 240 },
    { key: 'cdn', icon: 'cdn', label: 'CDN', x: 372, y: 106 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 206, y: 374 },
    { key: 'micro', icon: 'micro', label: 'Video Service', x: 372, y: 374 },
    { key: 'worker', icon: 'worker', label: 'Transcoder', x: 372, y: 240 },
    { key: 'blob', icon: 'blob', label: 'Video Storage', x: 538, y: 240 },
    { key: 'nosql', icon: 'nosql', label: 'Metadata DB', x: 538, y: 508 },
  ],
  edges: [
    [0, 1, 'stream'], [0, 2, 'upload/API'], [2, 3, ''], [3, 4, 'transcode job'],
    [4, 5, 'store encoded'], [3, 6, 'read/write'], [1, 5, 'origin fetch'],
    [6, 4, 'kick off transcode'],
  ],
  regions: [{ title: 'Video Backend', x: 336, y: 204, w: 334, h: 404, color: '#a78bfa' }],
  walkthrough: [
    [0, "The uploader's client calls the API Gateway to start a video upload, kicking off the ingestion pipeline before the video is watchable by anyone."],
    [2, "The API Gateway authenticates the upload request and routes it to the Video Service, which owns the video's lifecycle from upload through playback."],
    [3, 'The Video Service first creates a metadata record for the new video — title, owner, visibility, processing status — before any bytes are transcoded.'],
    [6, "The Metadata DB stores each video's title, description, duration, and processing status; it's what search, browse, and the player's info panel all read from."],
    [4, 'With the metadata record in place, the raw upload is handed off to the Transcoder, which converts it into an adaptive bitrate ladder (e.g. 1080p/720p/480p) so playback can adjust to each viewer\'s bandwidth.'],
    [5, 'Each encoded rendition is written to durable Video Storage (object storage) — this, not the raw upload, is what actually gets served to viewers.'],
    [1, "When a viewer plays the video, the CDN edge serves the encoded segments from its cache and only reaches back to Video Storage — an 'origin fetch' — the first time a region requests that video."],
  ],
};
