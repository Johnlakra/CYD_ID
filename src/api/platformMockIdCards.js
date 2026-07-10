// Platform Phase 4 — in-memory mock for /idcard-templates (Pillar D).
// Split out of platformMock.js to keep modules small; mirrors the backend
// response shapes exactly (shared/API_CONTRACT.md, Phase 4). State resets on
// refresh, same as the other mock layers.

import ParishIdPic from '../assets/images/Parish.jpg';
import DeaneryIdPic from '../assets/images/Deanery.jpg';
import DexcoIdPic from '../assets/images/Dexco.jpg';
import { buildJalandharLayout, GALLERY_STARTERS } from '../utils/idCardSeeds';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM, isValidLayout } from '../utils/idCardLayout';

const LATENCY_MS = 250;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (data, message = 'OK') => ({ success: true, message, data });
const fail = (message, status) => ({ success: false, message, data: null, status });

const clone = (value) => JSON.parse(JSON.stringify(value));

// Same convention as platformMock.js: diocese comes from the stored login,
// defaulting to the sample pending diocese so screens are demoable.
const currentDioceseId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const id = Number(user && user.diocese_id);
    return Number.isInteger(id) && id > 0 ? id : 2;
  } catch (e) {
    return 2;
  }
};

// ---- Seed state: Jalandhar's three legacy layouts, transcribed -------------

const jalandharSeed = (id, level, name, backgroundUrl) => ({
  id,
  diocese_id: 1,
  level,
  name,
  background_url: backgroundUrl,
  width_mm: CARD_WIDTH_MM,
  height_mm: CARD_HEIGHT_MM,
  layout_json: buildJalandharLayout(),
  is_default: 1,
  status: 1,
  created_by: 1,
  created_at: '2026-07-01T09:00:00.000Z',
});

const seedTemplates = () => [
  jalandharSeed(1, 'parish', 'Jalandhar Parish (legacy)', ParishIdPic),
  jalandharSeed(2, 'deanery', 'Jalandhar Deanery (legacy)', DeaneryIdPic),
  jalandharSeed(3, 'dexco', 'Jalandhar DEXCO (legacy)', DexcoIdPic),
];

let templates = seedTemplates();
let nextTemplateId = 4;

// Test hook — restores the pristine seed state.
export const __resetIdCardMock = () => {
  templates = seedTemplates();
  nextTemplateId = 4;
};

const activeForDiocese = (dioceseId) =>
  templates.filter((t) => t.diocese_id === dioceseId && t.status === 1);

const findActive = (id) =>
  templates.find((t) => t.id === Number(id) && t.diocese_id === currentDioceseId() && t.status === 1);

const validateBody = (body, { partial = false } = {}) => {
  if (!partial || body.level !== undefined) {
    if (!body.level || !String(body.level).trim()) return 'Template level is required';
  }
  if (!partial || body.name !== undefined) {
    if (!body.name || !String(body.name).trim()) return 'Template name is required';
  }
  if (!partial || body.background_url !== undefined) {
    if (!body.background_url) return 'A background image is required';
  }
  if (!partial || body.layout_json !== undefined) {
    if (!isValidLayout(body.layout_json)) return 'layout_json must contain an elements array';
  }
  return null;
};

// ---- Endpoints ---------------------------------------------------------------

export const mockListIdCardTemplates = async () => {
  await delay();
  return ok({ templates: clone(activeForDiocese(currentDioceseId())) });
};

export const mockGetIdCardGallery = async () => {
  await delay();
  return ok({
    card: { width_mm: CARD_WIDTH_MM, height_mm: CARD_HEIGHT_MM },
    templates: clone(GALLERY_STARTERS),
  });
};

export const mockResolveIdCardTemplate = async (level) => {
  await delay();
  const match = activeForDiocese(currentDioceseId()).find(
    (t) => t.level === level && t.is_default === 1
  );
  return ok({ template: match ? clone(match) : null });
};

export const mockGetIdCardTemplate = async (id) => {
  await delay();
  const template = findActive(id);
  return template ? ok({ template: clone(template) }) : fail('Template not found', 404);
};

export const mockCreateIdCardTemplate = async (body) => {
  await delay();
  const error = validateBody(body);
  if (error) return fail(error, 400);
  const template = {
    id: nextTemplateId++,
    diocese_id: currentDioceseId(),
    level: String(body.level).trim(),
    name: String(body.name).trim(),
    background_url: body.background_url,
    width_mm: Number(body.width_mm) || CARD_WIDTH_MM,
    height_mm: Number(body.height_mm) || CARD_HEIGHT_MM,
    layout_json: clone(body.layout_json),
    is_default: 0,
    status: 1,
    created_by: null,
    created_at: new Date().toISOString(),
  };
  templates = [...templates, template];
  return ok({ template: clone(template) }, 'Template created');
};

export const mockUpdateIdCardTemplate = async (id, body) => {
  await delay();
  const existing = findActive(id);
  if (!existing) return fail('Template not found', 404);
  const error = validateBody(body, { partial: true });
  if (error) return fail(error, 400);
  const updated = {
    ...existing,
    ...(body.level !== undefined ? { level: String(body.level).trim() } : null),
    ...(body.name !== undefined ? { name: String(body.name).trim() } : null),
    ...(body.background_url !== undefined ? { background_url: body.background_url } : null),
    ...(body.width_mm !== undefined ? { width_mm: Number(body.width_mm) } : null),
    ...(body.height_mm !== undefined ? { height_mm: Number(body.height_mm) } : null),
    ...(body.layout_json !== undefined ? { layout_json: clone(body.layout_json) } : null),
  };
  templates = templates.map((t) => (t.id === existing.id ? updated : t));
  return ok({ template: clone(updated) }, 'Template updated');
};

export const mockSetDefaultIdCardTemplate = async (id) => {
  await delay();
  const target = findActive(id);
  if (!target) return fail('Template not found', 404);
  templates = templates.map((t) => {
    if (t.diocese_id !== target.diocese_id || t.level !== target.level) return t;
    return { ...t, is_default: t.id === target.id ? 1 : 0 };
  });
  return ok({ id: target.id, level: target.level }, 'Default template set');
};

export const mockDuplicateIdCardTemplate = async (id, body = {}) => {
  await delay();
  const source = findActive(id);
  if (!source) return fail('Template not found', 404);
  const copy = {
    ...clone(source),
    id: nextTemplateId++,
    name: body.name ? String(body.name).trim() : `${source.name} (copy)`,
    is_default: 0,
    created_at: new Date().toISOString(),
  };
  templates = [...templates, copy];
  return ok({ template: clone(copy) }, 'Template duplicated');
};

export const mockDeleteIdCardTemplate = async (id) => {
  await delay();
  const target = findActive(id);
  if (!target) return fail('Template not found', 404);
  templates = templates.map((t) => (t.id === target.id ? { ...t, status: 0, is_default: 0 } : t));
  return ok({ message: 'Template deleted' }, 'Template deleted');
};
