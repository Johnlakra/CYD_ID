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

// ID-card-required fields (mirrors API_CONTRACT.md). An independent entry can be
// promoted to a full ID-card profile only once every one of these is present.
// `key` matches the field name on an independent row from GET /anubhav/independents.
export const ID_CARD_REQUIRED_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'father_name', label: "Father's name" },
  { key: 'deanery', label: 'Deanery' },
  { key: 'parish', label: 'Parish' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'phone', label: 'Phone' },
  { key: 'postal_address', label: 'Postal address' },
  { key: 'level', label: 'Level' },
  { key: 'designation', label: 'Designation' },
  { key: 'photo_url', label: 'Photo' },
];

// Level + designation option lists (mirror EditProfileDialog so independent
// entries collect the same controlled values an ID-card profile would).
export const LEVEL_OPTIONS = ['parish', 'deanery', 'dexco'];
export const DESIGNATION_OPTIONS = [
  'Member', 'President', 'Vice-President', 'Secretary', 'Joint Secretary',
  'Treasurer', 'Joint Treasurer', 'Media Secretary', 'Joint Media Secretary',
  'Boy Representative', 'Girl Representative', 'Boy Spokesperson', 'Girl Spokesperson',
];

// Returns the human labels of the ID-card-required fields still missing on a row.
// Empty array means the row is complete and ready to print / promote.
export const missingIdCardFields = (row) => {
  if (!row) return ID_CARD_REQUIRED_FIELDS.map((f) => f.label);
  return ID_CARD_REQUIRED_FIELDS.filter((f) => {
    const value = row[f.key];
    return !(value !== null && value !== undefined && String(value).trim() !== '');
  }).map((f) => f.label);
};

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
