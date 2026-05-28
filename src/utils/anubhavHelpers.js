// Anubhav 2026 — shared helpers for the event module.
// Pure functions only. No React imports.

import dayjs from 'dayjs';

export const PLACES = ['phagwara', 'abohar', 'amritsar'];

export const PLACE_META = {
  phagwara: {
    label: 'Phagwara',
    venue: "St. Joseph's Catholic Church, Phagwara",
    dates: '02-04 Jun 2026',
  },
  abohar: {
    label: 'Abohar',
    venue: "St. Joseph's Catholic Church, Abohar",
    dates: '04-06 Jun 2026',
  },
  amritsar: {
    label: 'Amritsar',
    venue: 'St. Francis Church, Amritsar',
    dates: '06-08 Jun 2026',
  },
};

// Deanery -> Place mapping (verbatim from MASTER_PLAN §1).
// Keys MUST match the existing deanery strings used elsewhere in the codebase
// (verified against ManageProfiles.jsx -> fallbackDeaneries; all 16 keys match
// the existing strings exactly, including 'Jalandhar Cantt.' with trailing dot).
export const DEANERY_TO_PLACE = {
  // Phagwara group
  Hoshiarpur: 'phagwara',
  Tanda: 'phagwara',
  'Jalandhar Cantt.': 'phagwara',
  'Jalandhar City': 'phagwara',
  Kapurthala: 'phagwara',
  Sahnewal: 'phagwara',
  Ludhiana: 'phagwara',

  // Abohar group
  Moga: 'abohar',
  Muktsar: 'abohar',
  Ferozpur: 'abohar',

  // Amritsar group
  'Tarn Taran': 'amritsar',
  Amritsar: 'amritsar',
  Ajnala: 'amritsar',
  'Fatehgarh Churian': 'amritsar',
  Dhariwal: 'amritsar',
  Gurdaspur: 'amritsar',
};

export const FEE_PER_YOUTH = 50;
export const SOFT_CAP_PER_PARISH = 15;

export const placeForDeanery = (deanery) => {
  if (!deanery) return null;
  return DEANERY_TO_PLACE[deanery] || null;
};

export const deaneriesForPlace = (place) => {
  if (!place) return [];
  return Object.keys(DEANERY_TO_PLACE).filter(
    (deanery) => DEANERY_TO_PLACE[deanery] === place
  );
};

const PLACE_CHIP_COLORS = {
  phagwara: 'primary',
  abohar: 'secondary',
  amritsar: 'success',
};

export const placeChipProps = (place) => {
  const meta = PLACE_META[place];
  if (!meta) {
    return { label: 'Unknown', color: 'default' };
  }
  return {
    label: meta.label,
    color: PLACE_CHIP_COLORS[place] || 'default',
  };
};

export const formatRupees = (amount) => {
  const value = Number(amount) || 0;
  return `Rs. ${value.toLocaleString('en-IN')}`;
};

// Display-only 12h formatter for "HH:mm" strings from the API.
// Returns '' for null/empty so callers can render conditionally.
export const to12h = (time) => {
  if (!time) return '';
  const [hStr, mStr = '00'] = String(time).split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${mStr} ${ampm}`;
};

// 12h date+time formatter for ISO timestamps (announcements, profile updated_at).
export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('MMM D, h:mm A') : '';
};

// Slash-style timestamp used in registration lists.
export const formatRegisteredAt = (iso) => {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('DD/MM/YYYY h:mm A') : '';
};
