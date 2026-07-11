// Platform Phase 5 — eventHelpers unit tests (AAA style, matches repo suite).

import {
  buildEventPayload,
  buildVenuePayload,
  displayFeeTotal,
  emptyEventDraft,
  emptyVenueDraft,
  eventStatusChip,
  formatDateRange,
  formatEventDate,
  nextStatuses,
  toCsv,
  validateBasics,
  validateToggles,
  validateVenue,
  validateVenues,
  validateWizardStep,
  venueKeyFromName,
} from './eventHelpers';

describe('event status lifecycle', () => {
  test('follows draft -> open -> closed -> archived and stops', () => {
    expect(nextStatuses('draft')).toEqual(['open']);
    expect(nextStatuses('open')).toEqual(['closed']);
    expect(nextStatuses('closed')).toEqual(['archived']);
    expect(nextStatuses('archived')).toEqual([]);
    expect(nextStatuses('nonsense')).toEqual([]);
  });

  test('maps statuses to chip meta with a safe fallback', () => {
    expect(eventStatusChip('open')).toEqual({ label: 'Open', color: 'success' });
    expect(eventStatusChip('weird')).toEqual({ label: 'weird', color: 'default' });
  });
});

describe('venueKeyFromName', () => {
  test('slugifies venue names into valid keys', () => {
    expect(venueKeyFromName("St. Joseph's Church, Phagwara")).toBe('st-joseph-s-church-phagwara');
    expect(venueKeyFromName('  Amritsar  ')).toBe('amritsar');
  });
});

describe('wizard validation', () => {
  test('rejects short names and missing scope_ref for scoped events', () => {
    expect(validateBasics({ ...emptyEventDraft(), name: 'ab' })).toMatch(/at least 3/);
    expect(
      validateBasics({ ...emptyEventDraft(), name: 'Parish Feast', scope: 'parish', scope_ref: '' })
    ).toMatch(/Select the parish/);
  });

  test('rejects end date before start date', () => {
    const draft = {
      ...emptyEventDraft(),
      name: 'Youth Camp',
      start_date: '2026-08-10',
      end_date: '2026-08-01',
    };
    expect(validateBasics(draft)).toMatch(/End date/);
  });

  test('accepts a valid diocese-wide draft', () => {
    expect(validateBasics({ ...emptyEventDraft(), name: 'Youth Camp' })).toBeNull();
  });

  test('validates venue keys, names and uniqueness', () => {
    expect(validateVenue({ ...emptyVenueDraft(), venue_key: 'Bad Key' })).toMatch(/Venue key/);
    expect(validateVenue({ ...emptyVenueDraft(), venue_key: 'ok-key', name: '' })).toMatch(/name/);
    expect(validateVenues([])).toMatch(/at least one venue/);
    const duplicate = { ...emptyVenueDraft(), venue_key: 'phagwara', name: 'A' };
    expect(validateVenues([duplicate, { ...duplicate, name: 'B' }])).toMatch(/unique/);
    expect(validateVenues([duplicate])).toBeNull();
  });

  test('requires a positive whole fee amount only when fees are enabled', () => {
    expect(validateToggles({ ...emptyEventDraft(), fee_enabled: true, fee_amount: 0 })).toMatch(/Fee amount/);
    expect(validateToggles({ ...emptyEventDraft(), fee_enabled: true, fee_amount: 50 })).toBeNull();
    expect(validateToggles({ ...emptyEventDraft(), fee_enabled: false, fee_amount: 0 })).toBeNull();
  });

  test('validateWizardStep routes to the right validator per step', () => {
    const draft = { ...emptyEventDraft(), name: 'Youth Camp' };
    expect(validateWizardStep(0, draft)).toBeNull();
    expect(validateWizardStep(1, draft)).toMatch(/at least one venue/);
    expect(validateWizardStep(2, draft)).toBeNull();
  });
});

describe('payload builders', () => {
  test('buildEventPayload normalizes flags, blanks and scope_ref', () => {
    const draft = {
      ...emptyEventDraft(),
      name: '  Parish Feast ',
      scope: 'parish',
      scope_ref: 'St. Mary, Kapurthala',
      fee_enabled: true,
      fee_amount: '25',
    };
    const payload = buildEventPayload(draft, 'open');
    expect(payload).toMatchObject({
      name: 'Parish Feast',
      scope: 'parish',
      scope_ref: 'St. Mary, Kapurthala',
      description: null,
      fee_enabled: 1,
      fee_amount: 25,
      accommodation_enabled: 0,
      timetable_enabled: 1,
      speakers_enabled: 1,
      status: 'open',
    });
  });

  test('buildEventPayload zeroes the fee and clears scope_ref for diocese scope', () => {
    const payload = buildEventPayload({ ...emptyEventDraft(), name: 'Camp', scope_ref: 'ignored' });
    expect(payload.scope_ref).toBeNull();
    expect(payload.fee_enabled).toBe(0);
    expect(payload.fee_amount).toBe(0);
    expect(payload.status).toBe('draft');
  });

  test('buildVenuePayload trims and defaults deaneries to an array', () => {
    const payload = buildVenuePayload({ venue_key: ' phagwara ', name: ' Venue ', deaneries: null });
    expect(payload).toMatchObject({ venue_key: 'phagwara', name: 'Venue', deaneries: [] });
  });
});

describe('display helpers', () => {
  test('displayFeeTotal multiplies only when fees are enabled', () => {
    expect(displayFeeTotal(10, { fee_enabled: 1, fee_amount: 50 })).toBe(500);
    expect(displayFeeTotal(10, { fee_enabled: 0, fee_amount: 50 })).toBe(0);
    expect(displayFeeTotal(undefined, { fee_enabled: 1, fee_amount: 50 })).toBe(0);
  });

  test('formats dates as DD-MM-YYYY with placeholders for blanks', () => {
    expect(formatEventDate('2026-06-02')).toBe('02-06-2026');
    expect(formatEventDate(null)).toBe('—');
    expect(formatDateRange('2026-06-02', '2026-06-04')).toBe('02-06-2026 → 04-06-2026');
    expect(formatDateRange(null, null)).toBe('Dates not set');
  });
});

describe('toCsv', () => {
  test('escapes commas and quotes', () => {
    const csv = toCsv(['Venue', 'Count'], [['St. Mary, Kapurthala', 12], ['Say "hi"', 0]]);
    expect(csv).toBe('Venue,Count\n"St. Mary, Kapurthala",12\n"Say ""hi""",0');
  });
});
