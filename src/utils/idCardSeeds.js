// Platform Phase 4 — seed layouts (Pillar D).
// buildJalandharLayout() is a 1:1 transcription of the legacy hardcoded
// IDCard.jsx layout (positions/fonts/colors copied verbatim) so the template
// render path is pixel-identical to the legacy branch for diocese 1.
// GALLERY_STARTERS are the generic starting designs served by
// GET /idcard-templates/gallery (backgrounds are uploaded by each diocese).

import { CARD_WIDTH_MM } from './idCardLayout';

const centered = (w) => Math.round(((CARD_WIDTH_MM - w) / 2) * 100) / 100;

// Legacy IDCard.jsx transcription. Centered legacy blocks used
// `left: 50%; translateX(-50%)` with an oversized width — equivalently
// transcribed as a full/fixed-width box with textAlign, same single-line
// output. fontSize stays in px exactly as the legacy inline styles.
export const buildJalandharLayout = () => ({
  elements: [
    { id: 'el_1', type: 'photo', x: centered(58), y: 42.5, w: 58, h: 67, border: '1px solid #8D8D8D', borderRadius: 14 },
    { id: 'el_2', type: 'text', field: 'name', x: 0, y: 111.2, w: CARD_WIDTH_MM, h: 14, fontSize: 31.5, fontFamily: 'Vidaloka', color: '#C01E2C', align: 'center' },
    { id: 'el_3', type: 'text', field: 'designation', x: 0, y: 121, w: CARD_WIDTH_MM, h: 8, fontSize: 16, fontFamily: 'Roboto', color: '#C01E2C', align: 'center' },
    { id: 'el_4', type: 'text', field: 'deanery', x: 54, y: 128, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_5', type: 'text', field: 'parish', x: 54, y: 136.1, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_6', type: 'text', field: 'date_of_baptism', x: 54, y: 144.12, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_7', type: 'text', field: 'date_of_birth', x: 54, y: 152.4, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_8', type: 'text', field: 'phone', x: 54, y: 160.68, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_9', type: 'text', field: 'father_name', x: 54, y: 168.96, w: 88, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', label: ':' },
    { id: 'el_10', type: 'static_text', label: ':', x: 54, y: 177.24, w: 35, h: 10, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', wrap: true },
    { id: 'el_11', type: 'text', field: 'postal_address', x: 56.9, y: 177.5, w: 82, h: 30, fontSize: 24.2, fontFamily: 'Gafata', color: '#000000', wrap: true, lineHeight: '96.5%' },
    { id: 'el_12', type: 'static_text', label: '|', x: centered(100), y: 213, w: 100, h: 8, fontSize: 19, fontFamily: 'Roboto', color: '#fff', align: 'center' },
    { id: 'el_13', type: 'text', field: 'issue_date', label: 'Issued:', x: centered(100), y: 213, w: 100, h: 8, fontSize: 19, fontFamily: 'Roboto', color: '#fff', align: 'left' },
    { id: 'el_14', type: 'static_text', label: 'Valid for two years', x: centered(100), y: 213, w: 100, h: 8, fontSize: 19, fontFamily: 'Roboto', color: '#fff', align: 'right' },
  ],
});

const modernLayout = () => ({
  elements: [
    { id: 'el_1', type: 'logo', x: 8, y: 8, w: 22, h: 22 },
    { id: 'el_2', type: 'photo', x: 8, y: 40, w: 50, h: 60, border: '1px solid #8D8D8D', borderRadius: 8 },
    { id: 'el_3', type: 'text', field: 'name', x: 64, y: 44, w: 76, h: 12, fontSize: 26, fontWeight: 700, color: '#1a1a1a', align: 'left' },
    { id: 'el_4', type: 'text', field: 'designation', x: 64, y: 56, w: 76, h: 8, fontSize: 15, color: '#555555', align: 'left' },
    { id: 'el_5', type: 'line', x: 64, y: 66, w: 76, h: 0.6, color: '#C01E2C' },
    { id: 'el_6', type: 'text', field: 'parish', x: 64, y: 70, w: 76, h: 8, fontSize: 15, color: '#1a1a1a', label: 'Parish:' },
    { id: 'el_7', type: 'text', field: 'deanery', x: 64, y: 79, w: 76, h: 8, fontSize: 15, color: '#1a1a1a', label: 'Deanery:' },
    { id: 'el_8', type: 'text', field: 'phone', x: 64, y: 88, w: 76, h: 8, fontSize: 15, color: '#1a1a1a', label: 'Phone:' },
    { id: 'el_9', type: 'qr', x: 108, y: 182, w: 30, h: 30 },
    { id: 'el_10', type: 'text', field: 'issue_date', x: 8, y: 205, w: 60, h: 8, fontSize: 13, color: '#555555', label: 'Issued:' },
  ],
});

const minimalLayout = () => ({
  elements: [
    { id: 'el_1', type: 'photo', x: centered(44), y: 30, w: 44, h: 52, border: '1px solid #8D8D8D', borderRadius: 22 },
    { id: 'el_2', type: 'text', field: 'name', x: 0, y: 90, w: CARD_WIDTH_MM, h: 12, fontSize: 28, fontWeight: 600, color: '#1a1a1a', align: 'center' },
    { id: 'el_3', type: 'text', field: 'parish', x: 0, y: 103, w: CARD_WIDTH_MM, h: 8, fontSize: 16, color: '#555555', align: 'center' },
    { id: 'el_4', type: 'text', field: 'phone', x: 0, y: 112, w: CARD_WIDTH_MM, h: 8, fontSize: 16, color: '#555555', align: 'center' },
    { id: 'el_5', type: 'line', x: centered(60), y: 124, w: 60, h: 0.6, color: '#C01E2C' },
    { id: 'el_6', type: 'text', field: 'level', x: 0, y: 128, w: CARD_WIDTH_MM, h: 8, fontSize: 14, color: '#1a1a1a', align: 'center', uppercase: true },
  ],
});

const photoLeftLayout = () => ({
  elements: [
    { id: 'el_1', type: 'photo', x: 8, y: 60, w: 56, h: 70, border: '1px solid #8D8D8D', borderRadius: 6 },
    { id: 'el_2', type: 'text', field: 'name', x: 70, y: 62, w: 70, h: 12, fontSize: 24, fontWeight: 700, color: '#1a1a1a' },
    { id: 'el_3', type: 'text', field: 'designation', x: 70, y: 74, w: 70, h: 8, fontSize: 14, color: '#C01E2C' },
    { id: 'el_4', type: 'text', field: 'deanery', x: 70, y: 86, w: 70, h: 8, fontSize: 14, color: '#1a1a1a', label: 'Deanery:' },
    { id: 'el_5', type: 'text', field: 'parish', x: 70, y: 95, w: 70, h: 8, fontSize: 14, color: '#1a1a1a', label: 'Parish:' },
    { id: 'el_6', type: 'text', field: 'date_of_birth', x: 70, y: 104, w: 70, h: 8, fontSize: 14, color: '#1a1a1a', label: 'DOB:' },
    { id: 'el_7', type: 'text', field: 'phone', x: 70, y: 113, w: 70, h: 8, fontSize: 14, color: '#1a1a1a', label: 'Phone:' },
    { id: 'el_8', type: 'text', field: 'postal_address', x: 8, y: 140, w: 130, h: 24, fontSize: 14, color: '#1a1a1a', wrap: true, label: 'Address:' },
    { id: 'el_9', type: 'qr', x: 8, y: 182, w: 30, h: 30 },
  ],
});

export const GALLERY_STARTERS = [
  {
    key: 'classic',
    name: 'Classic',
    description: 'The traditional CYD portrait card — centred photo, name and details list.',
    layout_json: buildJalandharLayout(),
  },
  {
    key: 'modern',
    name: 'Modern',
    description: 'Logo top-left, photo beside details, QR code at the bottom.',
    layout_json: modernLayout(),
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Clean centred layout with just the essentials.',
    layout_json: minimalLayout(),
  },
  {
    key: 'photo-left',
    name: 'Photo-left',
    description: 'Photo on the left, details on the right, address block below.',
    layout_json: photoLeftLayout(),
  },
];
