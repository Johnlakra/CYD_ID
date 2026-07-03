// Multi-diocese platform — shared helpers (Phases 1-2).
// Pure functions + tiny localStorage wrappers. No React imports.

// Mirrors the backend slug rules (controllers/platformController.js).
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,58}$/;

// 'Diocese of Jalandhar' -> 'diocese-of-jalandhar' (mirrors backend slugify).
export const slugify = (name) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const isValidSlug = (slug) => SLUG_PATTERN.test(String(slug || ''));

// Legacy Jalandhar users carry diocese_id 1, null, or (pre-platform logins)
// no field at all — all of them must see the untouched app.
export const isLegacyDiocese = (user) => {
  const id = user && user.diocese_id;
  return id === undefined || id === null || Number(id) === 1;
};

export const isSuperAdmin = (user) => !!user && user.role === 'super_admin';

// Diocese-scoped admin of a NEW (non-Jalandhar) diocese.
export const isNewDioceseAdmin = (user) =>
  !!user && user.role === 'admin' && !isLegacyDiocese(user);

export const DIOCESE_STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'error' },
};

export const dioceseStatusChip = (status) =>
  DIOCESE_STATUS_META[status] || { label: status || 'Unknown', color: 'default' };

// ---- File helpers (imports travel as raw base64 .xlsx in JSON bodies) ----

// FileReader -> raw base64 (data-URL prefix stripped; backend Buffer.from(b64)).
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaAt = result.indexOf(',');
      resolve(commaAt >= 0 ? result.slice(commaAt + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Trigger a browser download of a base64 payload (template / errors workbook).
export const downloadBase64File = (base64, fileName, mime = XLSX_MIME) => {
  const link = document.createElement('a');
  link.href = `data:${mime};base64,${base64}`;
  link.download = fileName;
  link.click();
};

// ---- Setup wizard progress (client-side; no setup-state endpoint yet) ----

const setupKey = (dioceseId) => `platformSetup:${dioceseId}`;

export const getSetupProgress = (dioceseId) => {
  try {
    const raw = localStorage.getItem(setupKey(dioceseId));
    return raw ? JSON.parse(raw) : { completed: false, step: 0 };
  } catch (e) {
    return { completed: false, step: 0 };
  }
};

export const saveSetupProgress = (dioceseId, progress) => {
  try {
    localStorage.setItem(setupKey(dioceseId), JSON.stringify(progress));
  } catch (e) {
    // Storage full/blocked — wizard simply re-offers next login.
  }
};

// ---- Import wizard display metadata ----

export const IMPORT_TYPES = {
  youth: {
    label: 'Youth profiles',
    description:
      'Bulk-create youth ID-card profiles. Optionally auto-create their login accounts.',
  },
  org: {
    label: 'Org structure',
    description:
      'Create deaneries and parishes from a two-column sheet. Existing pairs are skipped.',
  },
};

export const IMPORT_STEPS = ['Upload file', 'Map columns', 'Validate & commit'];
