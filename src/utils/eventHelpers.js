// Platform Phase 5 — shared helpers for the generalized Events module.
// Mirrors shared/API_CONTRACT.md ("Phase 5 — Generic Events Engine"):
// status lifecycle draft -> open -> closed -> archived, venues 1..n with
// unique venue_key per event, fee math is DISPLAY ONLY (the backend owns
// authoritative totals).

import dayjs from 'dayjs';

export const EVENT_SCOPES = ['diocese', 'deanery', 'parish'];

export const EVENT_STATUS_META = {
  draft: { label: 'Draft', color: 'default' },
  open: { label: 'Open', color: 'success' },
  closed: { label: 'Closed', color: 'warning' },
  archived: { label: 'Archived', color: 'error' },
};

export const eventStatusChip = (status) =>
  EVENT_STATUS_META[status] || { label: status || 'Unknown', color: 'default' };

// Forward-only lifecycle per contract: draft -> open -> closed -> archived.
const STATUS_TRANSITIONS = {
  draft: ['open'],
  open: ['closed'],
  closed: ['archived'],
  archived: [],
};

export const nextStatuses = (status) => STATUS_TRANSITIONS[status] || [];

export const WIZARD_STEPS = ['Basics & scope', 'Venues', 'Modules & fees', 'Review & publish'];

// Same shape rule the backend applies to event_venues.venue_key.
export const VENUE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,39}$/;

export const venueKeyFromName = (name) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export const emptyEventDraft = () => ({
  name: '',
  scope: 'diocese',
  scope_ref: '',
  description: '',
  start_date: '',
  end_date: '',
  fee_enabled: false,
  fee_amount: 0,
  accommodation_enabled: false,
  timetable_enabled: true,
  speakers_enabled: true,
  venues: [],
});

export const emptyVenueDraft = () => ({
  venue_key: '',
  name: '',
  address: '',
  start_date: '',
  end_date: '',
  deaneries: [],
});

// ---- Wizard step validation (each returns an error string or null) ----------

export const validateBasics = (draft) => {
  if (!draft || String(draft.name || '').trim().length < 3) {
    return 'Event name must be at least 3 characters';
  }
  if (!EVENT_SCOPES.includes(draft.scope)) {
    return 'Scope must be diocese, deanery or parish';
  }
  if (draft.scope !== 'diocese' && !String(draft.scope_ref || '').trim()) {
    return `Select the ${draft.scope} this event belongs to`;
  }
  if (draft.start_date && draft.end_date && dayjs(draft.end_date).isBefore(dayjs(draft.start_date))) {
    return 'End date cannot be before the start date';
  }
  return null;
};

export const validateVenue = (venue) => {
  if (!venue || !VENUE_KEY_PATTERN.test(String(venue.venue_key || ''))) {
    return 'Venue key must be 2-40 chars: lowercase letters, digits, - or _';
  }
  if (!String(venue.name || '').trim()) {
    return 'Venue name is required';
  }
  if (venue.start_date && venue.end_date && dayjs(venue.end_date).isBefore(dayjs(venue.start_date))) {
    return 'Venue end date cannot be before its start date';
  }
  return null;
};

export const validateVenues = (venues) => {
  if (!Array.isArray(venues) || venues.length === 0) {
    return 'Add at least one venue';
  }
  for (const venue of venues) {
    const error = validateVenue(venue);
    if (error) return `${venue.name || venue.venue_key || 'Venue'}: ${error}`;
  }
  const keys = venues.map((venue) => venue.venue_key);
  if (new Set(keys).size !== keys.length) {
    return 'Venue keys must be unique within the event';
  }
  return null;
};

export const validateToggles = (draft) => {
  if (draft && draft.fee_enabled) {
    const amount = Number(draft.fee_amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return 'Fee amount must be a whole number greater than zero';
    }
  }
  return null;
};

// Step index -> validator, so the wizard's Next button stays declarative.
export const validateWizardStep = (stepIndex, draft) => {
  if (stepIndex === 0) return validateBasics(draft);
  if (stepIndex === 1) return validateVenues(draft.venues);
  if (stepIndex === 2) return validateToggles(draft);
  return validateBasics(draft) || validateVenues(draft.venues) || validateToggles(draft);
};

// Wizard draft -> POST /events body (venues are created via /events/:id/venues).
export const buildEventPayload = (draft, status = 'draft') => ({
  name: String(draft.name || '').trim(),
  scope: draft.scope,
  scope_ref: draft.scope === 'diocese' ? null : String(draft.scope_ref || '').trim() || null,
  description: String(draft.description || '').trim() || null,
  start_date: draft.start_date || null,
  end_date: draft.end_date || null,
  fee_enabled: draft.fee_enabled ? 1 : 0,
  fee_amount: draft.fee_enabled ? Number(draft.fee_amount) : 0,
  accommodation_enabled: draft.accommodation_enabled ? 1 : 0,
  timetable_enabled: draft.timetable_enabled ? 1 : 0,
  speakers_enabled: draft.speakers_enabled ? 1 : 0,
  status,
});

export const buildVenuePayload = (venue) => ({
  venue_key: String(venue.venue_key || '').trim(),
  name: String(venue.name || '').trim() || null,
  address: String(venue.address || '').trim() || null,
  start_date: venue.start_date || null,
  end_date: venue.end_date || null,
  deaneries: Array.isArray(venue.deaneries) ? venue.deaneries : [],
});

// ---- Display helpers ---------------------------------------------------------

// DISPLAY ONLY — never treat as an authoritative money figure.
export const displayFeeTotal = (registrations, event) =>
  event && Number(event.fee_enabled) ? Number(registrations || 0) * Number(event.fee_amount || 0) : 0;

export const formatEventDate = (value) =>
  value ? dayjs(value).format('DD-MM-YYYY') : '—';

export const formatDateRange = (start, end) => {
  if (!start && !end) return 'Dates not set';
  if (start && end) return `${formatEventDate(start)} → ${formatEventDate(end)}`;
  return formatEventDate(start || end);
};

// ---- CSV export (client-side, from data already on screen) --------------------

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

export const downloadCsv = (fileName, csvText) => {
  const blob = new Blob([`﻿${csvText}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
