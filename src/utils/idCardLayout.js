// Platform Phase 4 — ID card template layout model (Pillar D).
// Pure constants + helpers shared by the designer, the renderer and the mock
// layer. layout_json element schema mirrors the backend contract
// (shared/API_CONTRACT.md, Phase 4): x/y/w/h are millimetres, fontSize is px.

export const CARD_WIDTH_MM = 146.3;
export const CARD_HEIGHT_MM = 221.8;

// CSS reference pixel: 1mm = 96 / 25.4 px. Used to place react-rnd boxes in
// screen pixels while layout_json stays in mm.
export const MM_TO_PX = 96 / 25.4;

export const SNAP_GRID_MM = 1;
export const MAX_UNDO_STATES = 50;

export const ELEMENT_TYPES = ['text', 'photo', 'qr', 'logo', 'static_text', 'line'];

// Profile fields a `text` element can bind to — matches the IDCard data prop.
export const FIELD_OPTIONS = [
  { field: 'name', label: 'Name' },
  { field: 'designation', label: 'Designation' },
  { field: 'deanery', label: 'Deanery' },
  { field: 'parish', label: 'Parish' },
  { field: 'date_of_baptism', label: 'Date of Baptism' },
  { field: 'date_of_birth', label: 'Date of Birth' },
  { field: 'phone', label: 'Phone' },
  { field: 'father_name', label: 'Father Name' },
  { field: 'mother_name', label: 'Mother Name' },
  { field: 'postal_address', label: 'Postal Address' },
  { field: 'qualification', label: 'Qualification' },
  { field: 'involvement', label: 'Involvement' },
  { field: 'issue_date', label: 'Issue Date' },
  { field: 'level', label: 'Level' },
];

export const DATE_FIELDS = ['date_of_baptism', 'date_of_birth', 'issue_date'];

export const FONT_FAMILIES = ['inherit', 'Roboto', 'Vidaloka', 'Gafata', 'Arial', 'Georgia'];

const roundMm = (value) => Math.round(value * 100) / 100;

export const mmToPx = (mm) => mm * MM_TO_PX;
export const pxToMm = (px) => roundMm(px / MM_TO_PX);

// Next free element id for a layout ("el_1", "el_2", ...).
export const nextElementId = (elements) => {
  const maxSuffix = elements.reduce((max, el) => {
    const match = /^el_(\d+)$/.exec(el.id || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `el_${maxSuffix + 1}`;
};

const TYPE_DEFAULTS = {
  text: { w: 60, h: 10, fontSize: 16, color: '#1a1a1a' },
  static_text: { w: 60, h: 10, fontSize: 16, color: '#1a1a1a', label: 'Text' },
  photo: { w: 40, h: 46, border: '1px solid #8D8D8D', borderRadius: 8 },
  qr: { w: 30, h: 30 },
  logo: { w: 24, h: 24 },
  line: { w: 80, h: 0.6, color: '#1a1a1a' },
};

// New element with sane defaults, centred-ish on the card.
export const createElement = (elements, type, overrides = {}) => {
  const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.text;
  return {
    id: nextElementId(elements),
    type,
    field: type === 'text' ? 'name' : undefined,
    x: roundMm((CARD_WIDTH_MM - (overrides.w || defaults.w)) / 2),
    y: 20,
    fontFamily: 'inherit',
    fontWeight: 400,
    align: 'left',
    rotation: 0,
    uppercase: false,
    label: null,
    ...defaults,
    ...overrides,
  };
};

// Immutable position/size clamp so elements stay on the card.
export const clampToCard = (element, widthMm = CARD_WIDTH_MM, heightMm = CARD_HEIGHT_MM) => {
  const w = Math.min(roundMm(element.w), widthMm);
  const h = Math.min(roundMm(element.h), heightMm);
  return {
    ...element,
    w,
    h,
    x: roundMm(Math.min(Math.max(element.x, 0), widthMm - w)),
    y: roundMm(Math.min(Math.max(element.y, 0), heightMm - h)),
  };
};

export const isValidLayout = (layoutJson) =>
  Boolean(layoutJson) && Array.isArray(layoutJson.elements);
