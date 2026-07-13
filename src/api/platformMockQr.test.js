// Phase 6 — QR mocks: my-qr, ensure, scan lookup w/ eligibility, registration.

import {
  __resetQrMock,
  mockEnsureProfileQr,
  mockGetMyQr,
  mockSearchQrProfiles,
} from './platformMockQr';
import {
  __resetEventsMock,
  mockGetEventStats,
  mockQrScanLookup,
  mockScanRegister,
} from './platformMockEvents';

const loginAs = (dioceseId) =>
  localStorage.setItem('user', JSON.stringify({ diocese_id: dioceseId }));

const ARUN_TOKEN = '11111111-1111-4111-8111-111111111111'; // Jalandhar City → phagwara batch
const SEEMA_TOKEN = '22222222-2222-4222-8222-222222222222'; // Moga → abohar batch

beforeEach(() => {
  __resetQrMock();
  __resetEventsMock();
  localStorage.clear();
});

describe('my-qr + ensure', () => {
  test('returns the CYD payload for the caller diocese', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockGetMyQr();

    // Assert
    expect(res.success).toBe(true);
    expect(res.data.payload).toBe(`CYD:jalandhar:${res.data.qr_token}`);
  });

  test('ensure generates and persists a token when missing', async () => {
    // Arrange — profile 103 is seeded without a token
    loginAs(1);

    // Act
    const first = await mockEnsureProfileQr(103);
    const second = await mockEnsureProfileQr(103);

    // Assert
    expect(first.success).toBe(true);
    expect(first.data.qr_token).toMatch(/^99999999-0000-4000-8000-/);
    expect(second.data.qr_token).toBe(first.data.qr_token);
  });

  test('ensure is tenant-scoped', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockEnsureProfileQr(101); // diocese-1 profile

    // Assert
    expect(res.status).toBe(404);
  });
});

describe('scan lookup', () => {
  test('rejects malformed tokens with 400', async () => {
    loginAs(1);
    const res = await mockQrScanLookup('junk');
    expect(res.status).toBe(400);
  });

  test('resolves a profile summary without event context', async () => {
    loginAs(1);
    const res = await mockQrScanLookup(ARUN_TOKEN);
    expect(res.data.profile).toMatchObject({ id: 101, deanery: 'Jalandhar City' });
    expect(res.data.eligibility).toBeUndefined();
  });

  test('reports eligible for a deanery assigned to the venue', async () => {
    loginAs(1);
    const res = await mockQrScanLookup(ARUN_TOKEN, { event_id: 1, venue_key: 'phagwara' });
    expect(res.data.eligibility).toMatchObject({
      event_open: true,
      deanery_allowed: true,
      already_registered: false,
      eligible: true,
      reason: null,
    });
  });

  test('reports the deanery mismatch reason for the wrong venue', async () => {
    loginAs(1);
    const res = await mockQrScanLookup(SEEMA_TOKEN, { event_id: 1, venue_key: 'phagwara' });
    expect(res.data.eligibility.eligible).toBe(false);
    expect(res.data.eligibility.reason).toMatch(/not assigned to venue 'phagwara'/);
  });

  test('is tenant-scoped: diocese 2 cannot resolve a diocese-1 token', async () => {
    loginAs(2);
    const res = await mockQrScanLookup(ARUN_TOKEN);
    expect(res.status).toBe(404);
  });
});

describe('instant registration', () => {
  test('registers via qr_token, bumps stats, then 409s on the duplicate', async () => {
    // Arrange
    loginAs(1);
    const before = await mockGetEventStats(1);

    // Act
    const first = await mockScanRegister(1, { venue_key: 'phagwara', qr_token: ARUN_TOKEN });
    const after = await mockGetEventStats(1);
    const dup = await mockScanRegister(1, { venue_key: 'phagwara', qr_token: ARUN_TOKEN });

    // Assert
    expect(first.success).toBe(true);
    expect(first.data.registration).toMatchObject({ event_id: 1, venue_key: 'phagwara', fee_amount: 50 });
    expect(first.data.profile.id).toBe(101);
    expect(after.data.total_registrations).toBe(before.data.total_registrations + 1);
    expect(dup.status).toBe(409);
    expect(dup.data.already_registered).toBe(true);
    expect(dup.data.registered_at).toBe(first.data.registration.created_at);
  });

  test('registers via profile_id (phone fallback path)', async () => {
    loginAs(1);
    const res = await mockScanRegister(1, { venue_key: 'abohar', profile_id: 102 });
    expect(res.success).toBe(true);
    expect(res.data.profile).toMatchObject({ id: 102, deanery: 'Moga' });
  });

  test('rejects a deanery not assigned to the venue with 400', async () => {
    loginAs(1);
    const res = await mockScanRegister(1, { venue_key: 'abohar', qr_token: ARUN_TOKEN });
    expect(res.status).toBe(400);
    expect(res.message).toMatch(/not assigned/);
  });

  test('rejects registrations for events that are not open', async () => {
    loginAs(2); // diocese-2 sample event is a draft
    const res = await mockScanRegister(2, {
      venue_key: 'cathedral-hall',
      qr_token: '33333333-3333-4333-8333-333333333333',
    });
    expect(res.status).toBe(400);
    expect(res.message).toMatch(/not open/);
  });

  test('lookup reflects already_registered after a scan', async () => {
    loginAs(1);
    await mockScanRegister(1, { venue_key: 'phagwara', qr_token: ARUN_TOKEN });
    const res = await mockQrScanLookup(ARUN_TOKEN, { event_id: 1, venue_key: 'phagwara' });
    expect(res.data.eligibility).toMatchObject({ already_registered: true, eligible: false });
    expect(res.data.eligibility.registered_at).toBeTruthy();
  });
});

describe('phone fallback search', () => {
  test('matches by phone fragment within the diocese', async () => {
    loginAs(1);
    const res = await mockSearchQrProfiles('00022');
    expect(res.data.profiles.map((p) => p.id)).toEqual([102]);
  });

  test('returns empty for blank queries', async () => {
    loginAs(1);
    const res = await mockSearchQrProfiles('  ');
    expect(res.data.profiles).toEqual([]);
  });
});
