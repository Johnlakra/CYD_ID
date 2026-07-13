// Platform Phase 6 — in-memory mock for QR token endpoints (Pillar F):
// GET /profile-holder/my-qr, POST /profiles/qr/ensure/:profileId, and the
// profile store the scan-desk lookup/registration mocks (platformMockEvents)
// resolve against. Separate module per the file-size rule. All profile rows
// here are synthetic demo people.

import { buildQrPayload } from '../utils/qrHelpers';

const LATENCY_MS = 250;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (data, message = 'OK') => ({ success: true, message, data });
const fail = (message, status) => ({ success: false, message, data: null, status });

const clone = (value) => JSON.parse(JSON.stringify(value));

// Same convention as the other platform mocks.
const currentDioceseId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const id = Number(user && user.diocese_id);
    return Number.isInteger(id) && id > 0 ? id : 2;
  } catch (e) {
    return 2;
  }
};

// Mirrors the diocese seeds in platformMock.js.
const DIOCESE_SLUGS = { 1: 'jalandhar', 2: 'shimla-chandigarh' };

export const mockDioceseSlug = (dioceseId) => DIOCESE_SLUGS[dioceseId] || `diocese-${dioceseId}`;

// Deaneries deliberately match the Anubhav venue batches in
// platformMockEvents so every eligibility branch is demoable:
// eligible / wrong-venue deanery / already registered / freshly ensured token.
const seedProfiles = () => [
  {
    id: 101,
    diocese_id: 1,
    name: 'arun masih',
    phone: '9876500011',
    parish: 'St. Mary, Jalandhar',
    deanery: 'Jalandhar City',
    level: 'parish',
    designation: 'Member',
    photo_url: null,
    qr_token: '11111111-1111-4111-8111-111111111111',
  },
  {
    id: 102,
    diocese_id: 1,
    name: 'seema gill',
    phone: '9876500022',
    parish: 'Sacred Heart, Moga',
    deanery: 'Moga',
    level: 'deanery',
    designation: 'Secretary',
    photo_url: null,
    qr_token: '22222222-2222-4222-8222-222222222222',
  },
  {
    id: 103,
    diocese_id: 1,
    name: 'victor dhillon',
    phone: '9876500033',
    parish: 'St. Francis, Amritsar',
    deanery: 'Amritsar',
    level: 'dexco',
    designation: 'President',
    photo_url: null,
    qr_token: null, // exercises the ensure-token path
  },
  {
    id: 201,
    diocese_id: 2,
    name: 'rohit thakur',
    phone: '9876500201',
    parish: 'Cathedral Parish',
    deanery: 'Shimla',
    level: 'parish',
    designation: 'Member',
    photo_url: null,
    qr_token: '33333333-3333-4333-8333-333333333333',
  },
];

let profiles = seedProfiles();
let nextTokenSeq = 1;

export const __resetQrMock = () => {
  profiles = seedProfiles();
  nextTokenSeq = 1;
};

// Deterministic fake UUID v4 so tests stay stable without a crypto dependency.
const nextToken = () => {
  const seq = String(nextTokenSeq++).padStart(12, '0');
  return `99999999-0000-4000-8000-${seq}`;
};

// ---- Cross-module finders (used by platformMockEvents scan endpoints) --------

export const findMockQrProfileByToken = (token, dioceseId) =>
  profiles.find(
    (profile) =>
      profile.qr_token &&
      profile.qr_token === String(token || '').toLowerCase() &&
      profile.diocese_id === dioceseId
  ) || null;

export const findMockQrProfileById = (profileId, dioceseId) =>
  profiles.find((profile) => profile.id === Number(profileId) && profile.diocese_id === dioceseId) ||
  null;

export const mockQrProfileSummary = (profile) => ({
  id: profile.id,
  name: profile.name,
  photo_url: profile.photo_url,
  parish: profile.parish,
  deanery: profile.deanery,
  level: profile.level,
  designation: profile.designation,
});

// ---- Endpoints ---------------------------------------------------------------

// GET /profile-holder/my-qr — demo semantics: the first profile of the
// caller's diocese acts as "my" profile.
export const mockGetMyQr = async () => {
  await delay();
  const dioceseId = currentDioceseId();
  const mine = profiles.find((profile) => profile.diocese_id === dioceseId);
  if (!mine) return fail('No profile found for this account', 404);
  if (!mine.qr_token) {
    const updated = { ...mine, qr_token: nextToken() };
    profiles = profiles.map((profile) => (profile.id === mine.id ? updated : profile));
    return ok({ qr_token: updated.qr_token, payload: buildQrPayload(mockDioceseSlug(dioceseId), updated.qr_token) });
  }
  return ok({ qr_token: mine.qr_token, payload: buildQrPayload(mockDioceseSlug(dioceseId), mine.qr_token) });
};

// POST /profiles/qr/ensure/:profileId — generates + persists a token if missing.
export const mockEnsureProfileQr = async (profileId) => {
  await delay();
  const dioceseId = currentDioceseId();
  const profile = findMockQrProfileById(profileId, dioceseId);
  if (!profile) return fail('Profile not found', 404);
  let token = profile.qr_token;
  if (!token) {
    token = nextToken();
    profiles = profiles.map((row) => (row.id === profile.id ? { ...row, qr_token: token } : row));
  }
  return ok({ qr_token: token, payload: buildQrPayload(mockDioceseSlug(dioceseId), token) });
};

// Scan-desk phone fallback (real mode uses the legacy GET /profiles?search=).
export const mockSearchQrProfiles = async (search) => {
  await delay();
  const term = String(search || '').trim().toLowerCase();
  if (!term) return ok({ profiles: [] });
  const dioceseId = currentDioceseId();
  const matches = profiles.filter(
    (profile) =>
      profile.diocese_id === dioceseId &&
      (profile.phone.includes(term) || profile.name.toLowerCase().includes(term))
  );
  return ok({ profiles: clone(matches.map(mockQrProfileSummary)) });
};
