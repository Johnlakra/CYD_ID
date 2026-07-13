// Platform Phase 5 — in-memory mock for /events (Pillar E).
// Split out of platformMock.js to keep modules small; mirrors the backend
// response shapes exactly (shared/API_CONTRACT.md, Phase 5). State resets on
// refresh, same as the other mock layers.

import { EVENT_SCOPES, VENUE_KEY_PATTERN } from '../utils/eventHelpers';
import { isValidQrToken } from '../utils/qrHelpers';
import {
  findMockQrProfileById,
  findMockQrProfileByToken,
  mockQrProfileSummary,
} from './platformMockQr';

const LATENCY_MS = 250;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (data, message = 'OK') => ({ success: true, message, data });
const fail = (message, status) => ({ success: false, message, data: null, status });

const clone = (value) => JSON.parse(JSON.stringify(value));

const EVENT_STATUSES = ['draft', 'open', 'closed', 'archived'];

// Same convention as the other platform mocks: diocese comes from the stored
// login, defaulting to the sample pending diocese so screens are demoable.
const currentDioceseId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const id = Number(user && user.diocese_id);
    return Number.isInteger(id) && id > 0 ? id : 2;
  } catch (e) {
    return 2;
  }
};

// ---- Seed state: Anubhav 2026 (diocese 1, mirrors migration 106) ------------

const seedEvents = () => [
  {
    id: 1,
    diocese_id: 1,
    name: 'Anubhav 2026',
    scope: 'diocese',
    scope_ref: null,
    description: 'CYD Jalandhar annual youth retreat 2026',
    start_date: '2026-06-02',
    end_date: '2026-06-08',
    fee_enabled: 1,
    fee_amount: 50,
    accommodation_enabled: 1,
    timetable_enabled: 1,
    speakers_enabled: 1,
    status: 'open',
    created_by: 1,
    created_at: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 2,
    diocese_id: 2,
    name: 'Parish Youth Feast',
    scope: 'parish',
    scope_ref: 'Cathedral Parish',
    description: 'Sample parish-scoped event without accommodation',
    start_date: '2026-09-12',
    end_date: '2026-09-12',
    fee_enabled: 0,
    fee_amount: 0,
    accommodation_enabled: 0,
    timetable_enabled: 1,
    speakers_enabled: 0,
    status: 'draft',
    created_by: null,
    created_at: '2026-07-01T09:00:00.000Z',
  },
];

const seedVenues = () => [
  {
    id: 1,
    event_id: 1,
    venue_key: 'phagwara',
    name: "St. Joseph's Catholic Church, Phagwara",
    address: null,
    start_date: '2026-06-02',
    end_date: '2026-06-04',
    deaneries: ['Hoshiarpur', 'Tanda', 'Jalandhar Cantt.', 'Jalandhar City', 'Kapurthala', 'Sahnewal', 'Ludhiana'],
  },
  {
    id: 2,
    event_id: 1,
    venue_key: 'abohar',
    name: "St. Joseph's Catholic Church, Abohar",
    address: null,
    start_date: '2026-06-04',
    end_date: '2026-06-06',
    deaneries: ['Moga', 'Muktsar', 'Ferozpur'],
  },
  {
    id: 3,
    event_id: 1,
    venue_key: 'amritsar',
    name: 'St. Francis Church, Amritsar',
    address: null,
    start_date: '2026-06-06',
    end_date: '2026-06-08',
    deaneries: ['Tarn Taran', 'Amritsar', 'Ajnala', 'Fatehgarh Churian', 'Dhariwal', 'Gurdaspur'],
  },
  {
    id: 4,
    event_id: 2,
    venue_key: 'cathedral-hall',
    name: 'Cathedral Parish Hall',
    address: null,
    start_date: '2026-09-12',
    end_date: '2026-09-12',
    deaneries: [],
  },
];

// Demo registration counts (mock-only; the backend counts anubhav_registrations).
const seedRegistrationCounts = () => ({ 1: { phagwara: 412, abohar: 158, amritsar: 236 }, 2: {} });

let events = seedEvents();
let venues = seedVenues();
let registrationCounts = seedRegistrationCounts();
// Phase 6: registrations created live at the scan desk (per-profile rows on
// top of the aggregate demo counts above).
let registrations = [];
let nextEventId = 3;
let nextVenueId = 5;
let nextRegistrationId = 1;

// Test hook — restores the pristine seed state.
export const __resetEventsMock = () => {
  events = seedEvents();
  venues = seedVenues();
  registrationCounts = seedRegistrationCounts();
  registrations = [];
  nextEventId = 3;
  nextVenueId = 5;
  nextRegistrationId = 1;
};

const eventsForDiocese = (dioceseId) => events.filter((event) => event.diocese_id === dioceseId);

const findEvent = (id) =>
  events.find((event) => event.id === Number(id) && event.diocese_id === currentDioceseId());

const venuesForEvent = (eventId) => venues.filter((venue) => venue.event_id === Number(eventId));

const validateEventBody = (body, { partial = false } = {}) => {
  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 3) {
      return 'Event name must be at least 3 characters';
    }
  }
  if (body.scope !== undefined && !EVENT_SCOPES.includes(body.scope)) {
    return 'Invalid event scope';
  }
  if (body.status !== undefined && !EVENT_STATUSES.includes(body.status)) {
    return 'Invalid event status';
  }
  if (body.fee_enabled && (!Number.isInteger(Number(body.fee_amount)) || Number(body.fee_amount) <= 0)) {
    return 'Fee amount must be a whole number greater than zero when fees are enabled';
  }
  return null;
};

const validateVenueBody = (body, { partial = false } = {}) => {
  if (!partial || body.venue_key !== undefined) {
    if (!VENUE_KEY_PATTERN.test(String(body.venue_key || ''))) {
      return 'Invalid venue key';
    }
  }
  if (body.deaneries !== undefined && body.deaneries !== null && !Array.isArray(body.deaneries)) {
    return 'deaneries must be an array';
  }
  return null;
};

// ---- Events CRUD ---------------------------------------------------------------

export const mockListEvents = async () => {
  await delay();
  const rows = eventsForDiocese(currentDioceseId()).map((event) => ({
    ...clone(event),
    venue_count: venuesForEvent(event.id).length,
  }));
  return ok({ events: rows, count: rows.length });
};

export const mockCreateEvent = async (body) => {
  await delay();
  const error = validateEventBody(body || {});
  if (error) return fail(error, 400);
  const event = {
    id: nextEventId++,
    diocese_id: currentDioceseId(),
    name: String(body.name).trim(),
    scope: body.scope || 'diocese',
    scope_ref: body.scope && body.scope !== 'diocese' ? body.scope_ref || null : null,
    description: body.description || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    fee_enabled: body.fee_enabled ? 1 : 0,
    fee_amount: body.fee_enabled ? Number(body.fee_amount) : 0,
    accommodation_enabled: body.accommodation_enabled ? 1 : 0,
    timetable_enabled: body.timetable_enabled === undefined || body.timetable_enabled ? 1 : 0,
    speakers_enabled: body.speakers_enabled === undefined || body.speakers_enabled ? 1 : 0,
    status: body.status || 'draft',
    created_by: null,
    created_at: new Date().toISOString(),
  };
  events = [...events, event];
  registrationCounts = { ...registrationCounts, [event.id]: {} };
  return ok({ event: clone(event) }, 'Event created');
};

export const mockGetEvent = async (id) => {
  await delay();
  const event = findEvent(id);
  if (!event) return fail('Event not found', 404);
  return ok({ event: { ...clone(event), venues: clone(venuesForEvent(event.id)) } });
};

export const mockUpdateEvent = async (id, body) => {
  await delay();
  const existing = findEvent(id);
  if (!existing) return fail('Event not found', 404);
  const error = validateEventBody(body || {}, { partial: true });
  if (error) return fail(error, 400);
  const updated = {
    ...existing,
    ...(body.name !== undefined ? { name: String(body.name).trim() } : null),
    ...(body.scope !== undefined ? { scope: body.scope } : null),
    ...(body.scope_ref !== undefined ? { scope_ref: body.scope_ref } : null),
    ...(body.description !== undefined ? { description: body.description } : null),
    ...(body.start_date !== undefined ? { start_date: body.start_date } : null),
    ...(body.end_date !== undefined ? { end_date: body.end_date } : null),
    ...(body.fee_enabled !== undefined ? { fee_enabled: body.fee_enabled ? 1 : 0 } : null),
    ...(body.fee_amount !== undefined ? { fee_amount: Number(body.fee_amount) || 0 } : null),
    ...(body.accommodation_enabled !== undefined
      ? { accommodation_enabled: body.accommodation_enabled ? 1 : 0 }
      : null),
    ...(body.timetable_enabled !== undefined ? { timetable_enabled: body.timetable_enabled ? 1 : 0 } : null),
    ...(body.speakers_enabled !== undefined ? { speakers_enabled: body.speakers_enabled ? 1 : 0 } : null),
    ...(body.status !== undefined ? { status: body.status } : null),
  };
  events = events.map((event) => (event.id === existing.id ? updated : event));
  return ok({ event: clone(updated) }, 'Event updated');
};

// Soft delete: contract says DELETE archives the event; rows stay queryable.
export const mockArchiveEvent = async (id) => {
  await delay();
  const existing = findEvent(id);
  if (!existing) return fail('Event not found', 404);
  events = events.map((event) =>
    event.id === existing.id ? { ...event, status: 'archived' } : event
  );
  return ok({ message: 'Event archived' }, 'Event archived');
};

// ---- Venue management ------------------------------------------------------------

export const mockListEventVenues = async (eventId) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const rows = clone(venuesForEvent(event.id));
  return ok({ venues: rows, count: rows.length });
};

export const mockCreateEventVenue = async (eventId, body) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const error = validateVenueBody(body || {});
  if (error) return fail(error, 400);
  const venueKey = String(body.venue_key).trim();
  if (venuesForEvent(event.id).some((venue) => venue.venue_key === venueKey)) {
    return fail(`Venue key "${venueKey}" already exists for this event`, 409);
  }
  const venue = {
    id: nextVenueId++,
    event_id: event.id,
    venue_key: venueKey,
    name: body.name || null,
    address: body.address || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    deaneries: Array.isArray(body.deaneries) ? [...body.deaneries] : [],
  };
  venues = [...venues, venue];
  return ok({ venue: clone(venue) }, 'Venue created');
};

export const mockUpdateEventVenue = async (eventId, venueId, body) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const existing = venuesForEvent(event.id).find((venue) => venue.id === Number(venueId));
  if (!existing) return fail('Venue not found', 404);
  const error = validateVenueBody(body || {}, { partial: true });
  if (error) return fail(error, 400);
  if (body.venue_key !== undefined) {
    const venueKey = String(body.venue_key).trim();
    const clash = venuesForEvent(event.id).some(
      (venue) => venue.id !== existing.id && venue.venue_key === venueKey
    );
    if (clash) return fail(`Venue key "${venueKey}" already exists for this event`, 409);
  }
  const updated = {
    ...existing,
    ...(body.venue_key !== undefined ? { venue_key: String(body.venue_key).trim() } : null),
    ...(body.name !== undefined ? { name: body.name } : null),
    ...(body.address !== undefined ? { address: body.address } : null),
    ...(body.start_date !== undefined ? { start_date: body.start_date } : null),
    ...(body.end_date !== undefined ? { end_date: body.end_date } : null),
    ...(body.deaneries !== undefined ? { deaneries: Array.isArray(body.deaneries) ? [...body.deaneries] : [] } : null),
  };
  venues = venues.map((venue) => (venue.id === existing.id ? updated : venue));
  return ok({ venue: clone(updated) }, 'Venue updated');
};

export const mockDeleteEventVenue = async (eventId, venueId) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const existing = venuesForEvent(event.id).find((venue) => venue.id === Number(venueId));
  if (!existing) return fail('Venue not found', 404);
  venues = venues.filter((venue) => venue.id !== existing.id);
  return ok({ message: 'Venue deleted' }, 'Venue deleted');
};

// ---- Stats -------------------------------------------------------------------------

export const mockGetEventStats = async (eventId) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const counts = registrationCounts[event.id] || {};
  const byVenue = venuesForEvent(event.id).map((venue) => ({
    venue_key: venue.venue_key,
    registrations:
      Number(counts[venue.venue_key] || 0) +
      registrations.filter(
        (row) => row.event_id === event.id && row.venue_key === venue.venue_key
      ).length,
  }));
  const total = byVenue.reduce((sum, row) => sum + row.registrations, 0);
  return ok({ event_id: event.id, by_venue: byVenue, total_registrations: total });
};

// ---- Phase 6: scan-desk lookup + instant registration -------------------------

const venueAllowsDeanery = (venue, deanery) => {
  const list = Array.isArray(venue.deaneries) ? venue.deaneries : [];
  if (list.length === 0) return true; // no batch restriction = open venue
  return list.includes(deanery);
};

const findRegistration = (eventId, venueKey, profileId) =>
  registrations.find(
    (row) => row.event_id === eventId && row.venue_key === venueKey && row.profile_id === profileId
  );

// GET /profiles/qr/:token[?event_id=&venue_key=] — mirrors routes/qr.js.
export const mockQrScanLookup = async (token, { event_id, venue_key } = {}) => {
  await delay();
  if (!isValidQrToken(token)) return fail('Invalid QR token format', 400);
  const dioceseId = currentDioceseId();
  const profile = findMockQrProfileByToken(token, dioceseId);
  if (!profile) return fail('No profile matches this QR code', 404);

  const payload = { profile: mockQrProfileSummary(profile) };
  const eventId = Number(event_id);
  if (eventId && venue_key) {
    const event = findEvent(eventId);
    if (!event) return fail('Event not found', 404);
    const venue = venuesForEvent(event.id).find((row) => row.venue_key === venue_key);
    if (!venue) return fail('Venue not found for this event', 404);

    const existing = findRegistration(event.id, venue_key, profile.id);
    const deaneryOk = venueAllowsDeanery(venue, profile.deanery);
    payload.eligibility = {
      event_id: event.id,
      venue_key,
      event_open: event.status === 'open',
      deanery_allowed: deaneryOk,
      already_registered: !!existing,
      registered_at: existing ? existing.created_at : null,
      eligible: event.status === 'open' && deaneryOk && !existing,
      reason: !deaneryOk
        ? `Deanery '${profile.deanery}' is not assigned to venue '${venue_key}'`
        : existing
          ? 'Already registered'
          : event.status !== 'open'
            ? 'Event is not open'
            : null,
    };
  }
  return ok(clone(payload));
};

// POST /events/:id/registrations — one of qr_token | profile_id required.
export const mockScanRegister = async (eventId, { venue_key, qr_token, profile_id } = {}) => {
  await delay();
  const event = findEvent(eventId);
  if (!event) return fail('Event not found', 404);
  const venue = venuesForEvent(event.id).find((row) => row.venue_key === venue_key);
  if (!venue) return fail('Venue not found for this event', 404);

  const dioceseId = currentDioceseId();
  const profile = qr_token
    ? findMockQrProfileByToken(qr_token, dioceseId)
    : findMockQrProfileById(profile_id, dioceseId);
  if (!profile) return fail('Profile not found', 404);

  if (event.status !== 'open') return fail('Event is not open for registrations', 400);
  if (!venueAllowsDeanery(venue, profile.deanery)) {
    return fail(`Deanery '${profile.deanery}' is not assigned to venue '${venue_key}'`, 400);
  }

  const existing = findRegistration(event.id, venue_key, profile.id);
  if (existing) {
    return {
      success: false,
      message: 'Already registered',
      status: 409,
      data: { already_registered: true, registered_at: existing.created_at },
    };
  }

  const registration = {
    id: nextRegistrationId++,
    event_id: event.id,
    venue_key,
    profile_id: profile.id,
    fee_amount: Number(event.fee_enabled) ? Number(event.fee_amount) : 0,
    created_at: new Date().toISOString(),
  };
  registrations = [...registrations, registration];
  return ok(
    { registration: clone(registration), profile: mockQrProfileSummary(profile) },
    'Registered'
  );
};
