// Platform Phase 6 — QR payload helpers (Pillar F).
// Payload format (shared/API_CONTRACT.md): `CYD:<diocese_slug>:<qr_token>` —
// opaque UUID v4 token, no PII; the server verifies every scan.

import dayjs from 'dayjs';
import QRCode from 'qrcode';

// Mirrors services/qrService.js on the backend.
export const QR_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYLOAD_PATTERN = /^CYD:([a-z0-9][a-z0-9-]{1,58}):([0-9a-f-]{36})$/i;

export const isValidQrToken = (token) => QR_TOKEN_PATTERN.test(String(token || ''));

export const buildQrPayload = (slug, token) => `CYD:${slug}:${token}`;

// Scanned text -> { slug, token } | null. Tolerates surrounding whitespace;
// anything that is not a CYD payload (URLs, other QR codes) resolves null.
export const parseQrPayload = (text) => {
  const match = PAYLOAD_PATTERN.exec(String(text || '').trim());
  if (!match) return null;
  const [, slug, token] = match;
  if (!isValidQrToken(token)) return null;
  return { slug: slug.toLowerCase(), token: token.toLowerCase() };
};

// Payload string -> SVG data URL for <img>/ID-card rendering (SVG needs no
// canvas, stays crisp at print scale, and rasterizes fine via html-to-image).
// Resolves null on failure so callers keep their placeholder instead of
// crashing the card.
export const toQrDataUrl = async (payload) => {
  if (!payload) return null;
  try {
    const svg = await QRCode.toString(payload, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch (e) {
    return null;
  }
};

// 12-hour display everywhere (project constraint).
export const formatScanTimestamp = (value) =>
  value ? dayjs(value).format('DD-MM-YYYY h:mm A') : '—';
