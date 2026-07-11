// Phase 5 — /events mock: tenant scoping, CRUD, venues, lifecycle, stats.

import {
  __resetEventsMock,
  mockArchiveEvent,
  mockCreateEvent,
  mockCreateEventVenue,
  mockDeleteEventVenue,
  mockGetEvent,
  mockGetEventStats,
  mockListEventVenues,
  mockListEvents,
  mockUpdateEvent,
  mockUpdateEventVenue,
} from './platformMockEvents';

const loginAs = (dioceseId) =>
  localStorage.setItem('user', JSON.stringify({ diocese_id: dioceseId }));

beforeEach(() => {
  __resetEventsMock();
  localStorage.clear();
});

describe('events mock — tenancy and seeds', () => {
  test('diocese 1 sees Anubhav 2026 with its 3 venues counted', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockListEvents();

    // Assert
    expect(res.success).toBe(true);
    expect(res.data.count).toBe(1);
    expect(res.data.events[0]).toMatchObject({
      name: 'Anubhav 2026',
      status: 'open',
      fee_enabled: 1,
      fee_amount: 50,
      venue_count: 3,
    });
  });

  test('diocese 2 sees only its sample parish-scoped draft', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockListEvents();

    // Assert
    expect(res.data.count).toBe(1);
    expect(res.data.events[0]).toMatchObject({
      name: 'Parish Youth Feast',
      scope: 'parish',
      accommodation_enabled: 0,
      status: 'draft',
    });
  });

  test('an event from another diocese is not reachable by id', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockGetEvent(1);

    // Assert
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});

describe('events mock — CRUD and lifecycle', () => {
  test('creates a draft event scoped to the caller diocese', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockCreateEvent({ name: 'Deanery Rally', scope: 'deanery', scope_ref: 'North Deanery' });

    // Assert
    expect(res.success).toBe(true);
    expect(res.data.event).toMatchObject({
      diocese_id: 2,
      status: 'draft',
      scope: 'deanery',
      scope_ref: 'North Deanery',
      timetable_enabled: 1,
      speakers_enabled: 1,
    });
  });

  test('rejects short names and bad fee config', async () => {
    // Arrange
    loginAs(2);

    // Act
    const shortName = await mockCreateEvent({ name: 'ab' });
    const badFee = await mockCreateEvent({ name: 'Fee Event', fee_enabled: 1, fee_amount: 0 });

    // Assert
    expect(shortName.status).toBe(400);
    expect(badFee.status).toBe(400);
  });

  test('updates toggles and walks the status lifecycle', async () => {
    // Arrange
    loginAs(2);

    // Act
    const opened = await mockUpdateEvent(2, { status: 'open', fee_enabled: 1, fee_amount: 20 });
    const closed = await mockUpdateEvent(2, { status: 'closed' });

    // Assert
    expect(opened.data.event).toMatchObject({ status: 'open', fee_enabled: 1, fee_amount: 20 });
    expect(closed.data.event.status).toBe('closed');
  });

  test('DELETE archives instead of removing the row', async () => {
    // Arrange
    loginAs(2);

    // Act
    const archived = await mockArchiveEvent(2);
    const list = await mockListEvents();

    // Assert
    expect(archived.success).toBe(true);
    expect(list.data.events[0].status).toBe('archived');
  });
});

describe('events mock — venues', () => {
  test('lists Anubhav venues with their deanery batches', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockListEventVenues(1);

    // Assert
    expect(res.data.count).toBe(3);
    expect(res.data.venues.map((v) => v.venue_key)).toEqual(['phagwara', 'abohar', 'amritsar']);
    expect(res.data.venues[1].deaneries).toEqual(['Moga', 'Muktsar', 'Ferozpur']);
  });

  test('rejects a duplicate venue_key with 409', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockCreateEventVenue(1, { venue_key: 'phagwara', name: 'Dup' });

    // Assert
    expect(res.success).toBe(false);
    expect(res.status).toBe(409);
  });

  test('creates, updates and deletes a venue', async () => {
    // Arrange
    loginAs(2);

    // Act
    const created = await mockCreateEventVenue(2, {
      venue_key: 'school-ground',
      name: 'School Ground',
      deaneries: ['Cathedral'],
    });
    const updated = await mockUpdateEventVenue(2, created.data.venue.id, { name: 'Main School Ground' });
    const deleted = await mockDeleteEventVenue(2, created.data.venue.id);
    const list = await mockListEventVenues(2);

    // Assert
    expect(created.data.venue).toMatchObject({ event_id: 2, deaneries: ['Cathedral'] });
    expect(updated.data.venue.name).toBe('Main School Ground');
    expect(deleted.success).toBe(true);
    expect(list.data.venues.map((v) => v.venue_key)).toEqual(['cathedral-hall']);
  });

  test('rejects an invalid venue_key shape', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockCreateEventVenue(2, { venue_key: 'Bad Key!', name: 'X' });

    // Assert
    expect(res.status).toBe(400);
  });
});

describe('events mock — stats', () => {
  test('returns per-venue counts and the total for Anubhav', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockGetEventStats(1);

    // Assert
    expect(res.data).toEqual({
      event_id: 1,
      by_venue: [
        { venue_key: 'phagwara', registrations: 412 },
        { venue_key: 'abohar', registrations: 158 },
        { venue_key: 'amritsar', registrations: 236 },
      ],
      total_registrations: 806,
    });
  });

  test('a fresh event reports zero registrations per venue', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockGetEventStats(2);

    // Assert
    expect(res.data.by_venue).toEqual([{ venue_key: 'cathedral-hall', registrations: 0 }]);
    expect(res.data.total_registrations).toBe(0);
  });
});
