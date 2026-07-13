// Platform Phase 6 — qrHelpers unit tests.

import {
  buildQrPayload,
  formatScanTimestamp,
  isValidQrToken,
  parseQrPayload,
  toQrDataUrl,
} from './qrHelpers';

const TOKEN = '3f2a1b4c-9d8e-4f01-a2b3-c4d5e6f70809';

describe('qr token + payload', () => {
  test('accepts UUID v4 tokens and rejects malformed ones', () => {
    expect(isValidQrToken(TOKEN)).toBe(true);
    expect(isValidQrToken('not-a-token')).toBe(false);
    expect(isValidQrToken('')).toBe(false);
    expect(isValidQrToken(null)).toBe(false);
  });

  test('builds the CYD:<slug>:<token> payload', () => {
    expect(buildQrPayload('jalandhar', TOKEN)).toBe(`CYD:jalandhar:${TOKEN}`);
  });

  test('parses a valid payload back to slug + token', () => {
    expect(parseQrPayload(`CYD:jalandhar:${TOKEN}`)).toEqual({ slug: 'jalandhar', token: TOKEN });
    expect(parseQrPayload(`  CYD:shimla-chandigarh:${TOKEN}\n`)).toEqual({
      slug: 'shimla-chandigarh',
      token: TOKEN,
    });
  });

  test('rejects non-CYD scans (URLs, junk, missing parts)', () => {
    expect(parseQrPayload('https://example.com/x')).toBeNull();
    expect(parseQrPayload('CYD:jalandhar')).toBeNull();
    expect(parseQrPayload(`CYD::${TOKEN}`)).toBeNull();
    expect(parseQrPayload('CYD:jalandhar:short-token')).toBeNull();
    expect(parseQrPayload('')).toBeNull();
  });
});

describe('toQrDataUrl', () => {
  test('renders a payload to an SVG data URL', async () => {
    const url = await toQrDataUrl(buildQrPayload('jalandhar', TOKEN));
    expect(url).toMatch(/^data:image\/svg\+xml;utf8,/);
  });

  test('resolves null for an empty payload', async () => {
    expect(await toQrDataUrl('')).toBeNull();
  });
});

describe('formatScanTimestamp', () => {
  test('formats in 12-hour style with a dash fallback', () => {
    expect(formatScanTimestamp('2026-06-02T09:15:00.000Z')).toMatch(/^02-06-2026 \d{1,2}:\d{2} (AM|PM)$/);
    expect(formatScanTimestamp(null)).toBe('—');
  });
});
