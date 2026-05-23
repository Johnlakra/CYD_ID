// Anubhav 2026 — shared helpers for the event module.
// Pure functions only. No React imports.

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
