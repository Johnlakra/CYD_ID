// Multi-diocese platform — in-memory mock layer (Phases 1-2).
// Mirrors the backend response shapes exactly (see shared/API_CONTRACT_PLATFORM.md)
// so screens built on the mock work unchanged against the live API.
// State resets on refresh, same as anubhavMock.

import { SLUG_PATTERN, slugify } from '../utils/platformHelpers';

const LATENCY_MS = 250;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (data, message = 'OK') => ({ success: true, message, data });
const fail = (message, status) => ({ success: false, message, data: null, status });

// Column catalog — verbatim from backend utils/importExcel.js.
const YOUTH_COLUMNS = [
  { key: 'name', label: 'Name', required: true, synonyms: ['name', 'fullname', 'youthname', 'candidatename'] },
  { key: 'father', label: 'Father', required: false, synonyms: ['father', 'fathername', 'fathersname'] },
  { key: 'mother', label: 'Mother', required: false, synonyms: ['mother', 'mothername', 'mothersname'] },
  { key: 'dob', label: 'DOB', required: true, synonyms: ['dob', 'dateofbirth', 'birthdate', 'birthday'] },
  { key: 'date_of_baptism', label: 'Date of Baptism', required: false, synonyms: ['dateofbaptism', 'baptism', 'baptismdate'] },
  { key: 'phone', label: 'Phone', required: true, synonyms: ['phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber', 'contactnumber', 'whatsapp'] },
  { key: 'postal_address', label: 'Postal Address', required: false, synonyms: ['address', 'postaladdress'] },
  { key: 'deanery', label: 'Deanery', required: true, synonyms: ['deanery', 'deanary'] },
  { key: 'parish', label: 'Parish', required: true, synonyms: ['parish', 'parishname', 'church'] },
  { key: 'qualification', label: 'Qualification', required: false, synonyms: ['qualification', 'education'] },
  { key: 'designation', label: 'Designation', required: false, synonyms: ['designation', 'post'] },
  { key: 'level', label: 'Level', required: false, synonyms: ['level', 'memberlevel'] },
  { key: 'involvement', label: 'Involvement', required: false, synonyms: ['involvement', 'ministry'] },
  { key: 'photo_url', label: 'Photo URL', required: false, synonyms: ['photo', 'photourl', 'photolink', 'image', 'imageurl'] },
];
const ORG_COLUMNS = [
  { key: 'deanery', label: 'Deanery', required: true, synonyms: ['deanery', 'deanary'] },
  { key: 'parish', label: 'Parish', required: true, synonyms: ['parish', 'parishname', 'church'] },
];
const COLUMNS_BY_TYPE = { youth: YOUTH_COLUMNS, org: ORG_COLUMNS };
const MAX_IMPORT_ROWS = 2000;

// ---- Seed state ------------------------------------------------------------

let dioceses = [
  {
    id: 1,
    name: 'Diocese of Jalandhar',
    slug: 'jalandhar',
    logo_url: null,
    contact_email: 'youth@jalandhardiocese.org',
    contact_phone: '9800000001',
    address: 'Bishop’s House, Jalandhar, Punjab',
    status: 'active',
    created_at: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 2,
    name: 'Diocese of Shimla and Chandigarh',
    slug: 'shimla-chandigarh',
    logo_url: null,
    contact_email: 'youth@shimlachd.org',
    contact_phone: '9800000002',
    address: 'Catholic Church, Chandigarh',
    status: 'pending',
    created_at: '2026-06-28T10:30:00.000Z',
  },
];
let nextDioceseId = 3;

// Org structure per diocese. Approved new dioceses start empty.
const orgByDiocese = {
  2: { deaneries: [], nextDeaneryId: 1, nextParishId: 1 },
};

// Youth profiles created by imports, per diocese (phone-duplicate checks).
const importedPhonesByDiocese = {};

let importJobs = [];
let nextJobId = 1;

// The mock resolves the caller's diocese from the stored login, defaulting to
// the sample pending diocese so the org/import screens are demoable.
const currentDioceseId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const id = Number(user && user.diocese_id);
    return Number.isInteger(id) && id > 0 ? id : 2;
  } catch (e) {
    return 2;
  }
};

const orgFor = (dioceseId) => {
  if (!orgByDiocese[dioceseId]) {
    orgByDiocese[dioceseId] = { deaneries: [], nextDeaneryId: 1, nextParishId: 1 };
  }
  return orgByDiocese[dioceseId];
};

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---- Phase 1: dioceses -----------------------------------------------------

export const mockRegisterDiocese = async (body) => {
  await delay();
  const name = String(body.name || '').trim();
  if (name.length < 3) return fail('Diocese name must be between 3 and 150 characters', 400);
  if (!body.contact_email || !/\S+@\S+\.\S+/.test(body.contact_email)) {
    return fail('A valid contact email is required', 400);
  }
  if (!body.contact_phone || String(body.contact_phone).trim().length < 7) {
    return fail('A valid contact phone is required', 400);
  }

  const slug = String(body.slug || slugify(name)).toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return fail('Could not derive a valid slug from the diocese name; provide a slug of lowercase letters, numbers and hyphens', 400);
  }
  if (dioceses.some((d) => d.slug === slug)) {
    return fail('A diocese with this slug is already registered', 409);
  }

  const diocese = {
    id: nextDioceseId++,
    name,
    slug,
    logo_url: body.logo_url || null,
    contact_email: body.contact_email,
    contact_phone: body.contact_phone,
    address: body.address || null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  dioceses = [diocese, ...dioceses];
  return ok(
    { id: diocese.id, name, slug, status: 'pending' },
    'Diocese registration submitted; awaiting platform approval'
  );
};

export const mockListDioceses = async (params = {}) => {
  await delay();
  const list = params.status ? dioceses.filter((d) => d.status === params.status) : dioceses;
  return ok({ dioceses: clone(list) }, 'Dioceses retrieved');
};

export const mockApproveDiocese = async (id) => {
  await delay();
  const diocese = dioceses.find((d) => d.id === Number(id));
  if (!diocese) return fail('Diocese not found', 404);
  if (diocese.status === 'active') return fail('Diocese is already active', 409);
  if (!diocese.contact_phone) {
    return fail('Diocese has no contact phone on record; cannot generate admin credentials', 400);
  }

  diocese.status = 'active';
  orgFor(diocese.id);
  return ok(
    {
      id: diocese.id,
      slug: diocese.slug,
      status: 'active',
      admin: {
        username: `${diocese.slug}.admin`,
        created: true,
        password_hint: 'registered contact phone',
      },
    },
    'Diocese approved; admin account created'
  );
};

export const mockSuspendDiocese = async (id) => {
  await delay();
  if (Number(id) === 1) return fail('The legacy diocese cannot be suspended', 400);
  const diocese = dioceses.find((d) => d.id === Number(id));
  if (!diocese) return fail('Diocese not found', 404);
  diocese.status = 'suspended';
  return ok({ id: diocese.id, status: 'suspended' }, 'Diocese suspended');
};

// ---- Phase 2: org structure -------------------------------------------------

export const mockGetOrgStructure = async () => {
  await delay();
  const org = orgFor(currentDioceseId());
  return ok(
    {
      deaneries: clone(org.deaneries).map((d) => ({
        id: d.id,
        name: d.name,
        parishes: d.parishes,
      })),
    },
    'Org structure retrieved'
  );
};

export const mockCreateDeanery = async ({ name }) => {
  await delay();
  const trimmed = String(name || '').trim();
  if (trimmed.length < 2) return fail('Name must be between 2 and 200 characters', 400);
  const org = orgFor(currentDioceseId());
  if (org.deaneries.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
    return fail('Deanery already exists in this diocese', 409);
  }
  const deanery = { id: org.nextDeaneryId++, name: trimmed, parishes: [] };
  org.deaneries.push(deanery);
  org.deaneries.sort((a, b) => a.name.localeCompare(b.name));
  return ok({ id: deanery.id, name: trimmed }, 'Deanery created');
};

export const mockUpdateDeanery = async (id, { name }) => {
  await delay();
  const org = orgFor(currentDioceseId());
  const deanery = org.deaneries.find((d) => d.id === Number(id));
  if (!deanery) return fail('Deanery not found in this diocese', 404);
  deanery.name = String(name || '').trim();
  return ok({ id: deanery.id, name: deanery.name }, 'Deanery updated');
};

export const mockDeleteDeanery = async (id) => {
  await delay();
  const org = orgFor(currentDioceseId());
  const deanery = org.deaneries.find((d) => d.id === Number(id));
  if (!deanery) return fail('Deanery not found in this diocese', 404);
  if (deanery.parishes.length > 0) {
    return fail('Deanery still has parishes; delete or move them first', 409);
  }
  org.deaneries = org.deaneries.filter((d) => d.id !== deanery.id);
  return ok({ id: deanery.id }, 'Deanery deleted');
};

export const mockCreateParish = async ({ deanery_id, name }) => {
  await delay();
  const trimmed = String(name || '').trim();
  if (trimmed.length < 2) return fail('Name must be between 2 and 200 characters', 400);
  const org = orgFor(currentDioceseId());
  const deanery = org.deaneries.find((d) => d.id === Number(deanery_id));
  if (!deanery) return fail('Deanery not found in this diocese', 404);
  if (deanery.parishes.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return fail('Parish already exists in this deanery', 409);
  }
  const parish = { id: org.nextParishId++, name: trimmed };
  deanery.parishes.push(parish);
  deanery.parishes.sort((a, b) => a.name.localeCompare(b.name));
  return ok({ id: parish.id, name: trimmed, deanery_id: deanery.id }, 'Parish created');
};

export const mockUpdateParish = async (id, { name }) => {
  await delay();
  const org = orgFor(currentDioceseId());
  for (const deanery of org.deaneries) {
    const parish = deanery.parishes.find((p) => p.id === Number(id));
    if (parish) {
      parish.name = String(name || '').trim();
      return ok({ id: parish.id, name: parish.name }, 'Parish updated');
    }
  }
  return fail('Parish not found in this diocese', 404);
};

export const mockDeleteParish = async (id) => {
  await delay();
  const org = orgFor(currentDioceseId());
  for (const deanery of org.deaneries) {
    const parish = deanery.parishes.find((p) => p.id === Number(id));
    if (parish) {
      deanery.parishes = deanery.parishes.filter((p) => p.id !== parish.id);
      return ok({ id: parish.id }, 'Parish deleted');
    }
  }
  return fail('Parish not found in this diocese', 404);
};

// ---- Phase 2: import wizard --------------------------------------------------

// Unicode-safe base64 <-> text (the real backend exchanges .xlsx; the mock
// exchanges CSV text so the wizard is fully demoable without a server).
const textToBase64 = (text) => btoa(unescape(encodeURIComponent(text)));
const base64ToText = (base64) => {
  try {
    return decodeURIComponent(escape(atob(String(base64 || ''))));
  } catch (e) {
    return null;
  }
};

const normalizeHeader = (value) =>
  String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9]/g, '');

const suggestMapping = (headers, type) => {
  const columns = COLUMNS_BY_TYPE[type];
  const normalized = headers.map(normalizeHeader);
  const mapping = {};
  const used = new Set();
  for (const column of columns) {
    const idx = normalized.findIndex((h, i) => !used.has(i) && h !== '' && column.synonyms.includes(h));
    if (idx !== -1) {
      mapping[column.key] = idx;
      used.add(idx);
    }
  }
  return {
    mapping,
    unmapped_required: columns.filter((c) => c.required && mapping[c.key] === undefined).map((c) => c.key),
    unmatched_headers: headers.filter((h, i) => !used.has(i) && h !== ''),
  };
};

// Minimal CSV split (no quoted-comma support — mock only).
const parseCsv = (text) => {
  const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line, i) => ({
    row_number: i + 2,
    values: line.split(',').map((v) => v.trim()),
  }));
  return { headers, rows };
};

// Binary payloads (e.g. a real .xlsx) decode to control characters — reject
// them so the wizard shows the "not readable" error instead of garbage rows.
const looksBinary = (text) => {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 8 || (code >= 14 && code <= 31)) return true;
  }
  return false;
};

const readMockSheet = (fileBase64) => {
  const text = base64ToText(fileBase64);
  if (text === null || text.trim() === '' || looksBinary(text)) return null;
  const { headers, rows } = parseCsv(text);
  if (headers.length === 0) return null;
  return { headers, rows };
};

export const mockGetImportTemplate = async (type = 'youth') => {
  await delay();
  const resolvedType = type === 'org' ? 'org' : 'youth';
  const columns = COLUMNS_BY_TYPE[resolvedType];
  const sample =
    resolvedType === 'youth'
      ? ['Maria Joseph', 'Joseph K', 'Anna Joseph', '2004-05-21', '2004-07-15', '9876543210',
         '12 Church Road', 'Sample Deanery', 'Sample Parish', 'B.A.', 'Member', 'Parish', 'Choir', '']
      : ['Sample Deanery', 'Sample Parish'];
  const csv = `${columns.map((c) => c.label).join(',')}\n${sample.join(',')}\n`;
  return ok(
    {
      // Real backend returns an .xlsx; the mock returns CSV for browser-side demo.
      file_name: `cyd_${resolvedType}_import_template.csv`,
      file_base64: textToBase64(csv),
      columns: columns.map(({ key, label, required }) => ({ key, label, required })),
    },
    'Template generated'
  );
};

export const mockParseImport = async ({ type, file_base64 }) => {
  await delay();
  const resolvedType = type === 'org' ? 'org' : 'youth';
  const sheet = readMockSheet(file_base64);
  if (!sheet) {
    return fail('File is not a readable .xlsx workbook (mock mode reads CSV — export your sheet as CSV to demo)', 400);
  }
  if (sheet.rows.length > MAX_IMPORT_ROWS) {
    return fail(`File has ${sheet.rows.length} rows; the maximum per import is ${MAX_IMPORT_ROWS}. Split the file and retry.`, 400);
  }
  const suggestion = suggestMapping(sheet.headers, resolvedType);
  return ok(
    {
      headers: sheet.headers,
      total_rows: sheet.rows.length,
      sample_rows: sheet.rows.slice(0, 5).map((r) => r.values),
      suggested_mapping: suggestion.mapping,
      unmapped_required: suggestion.unmapped_required,
      unmatched_headers: suggestion.unmatched_headers,
    },
    'File parsed'
  );
};

const parseDateValue = (value) => {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
};

const cleanPhone = (value) => String(value == null ? '' : value).replace(/[^0-9]/g, '');
const DEFAULTS = { level: 'Parish', designation: 'Member', qualification: '', involvement: '' };

const resolveMapping = (body, sheet, type) => {
  const provided = body.mapping && Object.keys(body.mapping).length ? body.mapping : null;
  const mapping = provided || suggestMapping(sheet.headers, type).mapping;
  const missing = COLUMNS_BY_TYPE[type]
    .filter((c) => c.required && (mapping[c.key] === undefined || mapping[c.key] === null))
    .map((c) => c.label);
  return { mapping, missing };
};

const checkYouthRows = (rows, mapping) => {
  const org = orgFor(currentDioceseId());
  const orgIndex = new Map(
    org.deaneries.map((d) => [d.name.toLowerCase(), {
      name: d.name,
      parishes: new Map(d.parishes.map((p) => [p.name.toLowerCase(), p.name])),
    }])
  );
  const dioceseId = currentDioceseId();
  if (!importedPhonesByDiocese[dioceseId]) importedPhonesByDiocese[dioceseId] = new Set();
  const knownPhones = importedPhonesByDiocese[dioceseId];
  const phonesInFile = new Set();

  const pick = (values, key) => {
    const idx = mapping[key];
    if (idx === undefined || idx === null) return '';
    return String(values[idx] == null ? '' : values[idx]).trim();
  };

  const validRows = [];
  const failedRows = [];
  for (const row of rows) {
    const errors = [];
    const data = {};
    for (const column of YOUTH_COLUMNS) data[column.key] = pick(row.values, column.key);

    if (!data.name || data.name.length < 2) errors.push('Name is missing');

    const dob = parseDateValue(data.dob);
    if (!dob) errors.push('DOB is missing or not a valid date');
    data.dob = dob || data.dob;
    data.date_of_baptism = parseDateValue(data.date_of_baptism) || dob;

    const phone = cleanPhone(data.phone);
    if (phone.length < 7) errors.push('Phone is missing or too short');
    else if (knownPhones.has(phone)) errors.push('Phone already exists in this diocese');
    else if (phonesInFile.has(phone)) errors.push('Phone is duplicated within the file');
    data.phone = phone || data.phone;

    const deanery = orgIndex.get(String(data.deanery).toLowerCase());
    if (!data.deanery) errors.push('Deanery is missing');
    else if (!deanery) errors.push(`Unknown deanery '${data.deanery}' for this diocese`);
    else {
      data.deanery = deanery.name;
      const parishName = deanery.parishes.get(String(data.parish).toLowerCase());
      if (!data.parish) errors.push('Parish is missing');
      else if (!parishName) errors.push(`Unknown parish '${data.parish}' in deanery '${deanery.name}'`);
      else data.parish = parishName;
    }

    for (const [key, fallback] of Object.entries(DEFAULTS)) {
      if (!data[key]) data[key] = fallback;
    }

    if (errors.length) failedRows.push({ row_number: row.row_number, data, errors });
    else {
      phonesInFile.add(phone);
      validRows.push({ row_number: row.row_number, data });
    }
  }
  return { validRows, failedRows, phonesInFile };
};

const buildErrorCsv = (type, failedRows) => {
  const columns = COLUMNS_BY_TYPE[type];
  const header = [...columns.map((c) => c.label), 'Errors'].join(',');
  const lines = failedRows.map((r) =>
    [...columns.map((c) => String(r.data[c.key] == null ? '' : r.data[c.key])), r.errors.join('; ')].join(',')
  );
  return textToBase64(`${header}\n${lines.join('\n')}\n`);
};

export const mockValidateYouthImport = async (body) => {
  await delay();
  const sheet = readMockSheet(body.file_base64);
  if (!sheet || sheet.rows.length === 0) return fail('File contains no data rows', 400);
  const { mapping, missing } = resolveMapping(body, sheet, 'youth');
  if (missing.length) return fail(`Required columns not mapped: ${missing.join(', ')}`, 400);

  const { validRows, failedRows } = checkYouthRows(sheet.rows, mapping);
  return ok(
    {
      total_rows: sheet.rows.length,
      valid_rows: validRows.length,
      invalid_rows: failedRows.length,
      preview: validRows.slice(0, 100).map((r) => ({ row_number: r.row_number, ...r.data })),
      errors: failedRows.map((r) => ({ row_number: r.row_number, errors: r.errors })),
    },
    'Validation complete'
  );
};

export const mockCommitYouthImport = async (body) => {
  await delay(500);
  const sheet = readMockSheet(body.file_base64);
  if (!sheet || sheet.rows.length === 0) return fail('File contains no data rows', 400);
  const { mapping, missing } = resolveMapping(body, sheet, 'youth');
  if (missing.length) return fail(`Required columns not mapped: ${missing.join(', ')}`, 400);

  const { validRows, failedRows } = checkYouthRows(sheet.rows, mapping);
  const autoCreateUsers = !!(body.options && body.options.auto_create_users);
  const dioceseId = currentDioceseId();

  const credentials = [];
  for (const row of validRows) {
    importedPhonesByDiocese[dioceseId].add(row.data.phone);
    if (autoCreateUsers) {
      const letters = String(row.data.name).toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) || 'user';
      const ddmm = String(row.data.dob).slice(8, 10) + String(row.data.dob).slice(5, 7);
      credentials.push({ row_number: row.row_number, name: row.data.name, username: `${letters}${ddmm}` });
    }
  }

  importJobs = [
    {
      id: nextJobId++,
      type: 'youth',
      file_name: body.file_name || null,
      total_rows: sheet.rows.length,
      inserted_rows: validRows.length,
      failed_rows: failedRows.length,
      users_created: credentials.length,
      status: 'completed',
      created_by: 1,
      created_at: new Date().toISOString(),
    },
    ...importJobs,
  ];

  return ok(
    {
      total_rows: sheet.rows.length,
      inserted_rows: validRows.length,
      failed_rows: failedRows.length,
      users_created: credentials.length,
      credentials,
      errors: failedRows.map((r) => ({ row_number: r.row_number, errors: r.errors })),
      error_file_base64: failedRows.length ? buildErrorCsv('youth', failedRows) : null,
    },
    `Imported ${validRows.length} of ${sheet.rows.length} rows`
  );
};

export const mockCommitOrgImport = async (body) => {
  await delay(500);
  const sheet = readMockSheet(body.file_base64);
  if (!sheet || sheet.rows.length === 0) return fail('File contains no data rows', 400);
  const { mapping, missing } = resolveMapping(body, sheet, 'org');
  if (missing.length) return fail(`Required columns not mapped: ${missing.join(', ')}`, 400);

  const org = orgFor(currentDioceseId());
  const pick = (values, key) => {
    const idx = mapping[key];
    return String(idx === undefined || values[idx] == null ? '' : values[idx]).trim();
  };

  let deaneriesCreated = 0;
  let parishesCreated = 0;
  let skipped = 0;
  const failedRows = [];

  for (const row of sheet.rows) {
    const deaneryName = pick(row.values, 'deanery');
    const parishName = pick(row.values, 'parish');
    if (!deaneryName || !parishName) {
      failedRows.push({
        row_number: row.row_number,
        data: { deanery: deaneryName, parish: parishName },
        errors: ['Deanery and Parish are both required'],
      });
      continue;
    }

    let deanery = org.deaneries.find((d) => d.name.toLowerCase() === deaneryName.toLowerCase());
    if (!deanery) {
      deanery = { id: org.nextDeaneryId++, name: deaneryName, parishes: [] };
      org.deaneries.push(deanery);
      deaneriesCreated++;
    }
    if (deanery.parishes.some((p) => p.name.toLowerCase() === parishName.toLowerCase())) {
      skipped++;
      continue;
    }
    deanery.parishes.push({ id: org.nextParishId++, name: parishName });
    parishesCreated++;
  }
  org.deaneries.sort((a, b) => a.name.localeCompare(b.name));

  importJobs = [
    {
      id: nextJobId++,
      type: 'org',
      file_name: body.file_name || null,
      total_rows: sheet.rows.length,
      inserted_rows: deaneriesCreated + parishesCreated,
      failed_rows: failedRows.length,
      users_created: 0,
      status: 'completed',
      created_by: 1,
      created_at: new Date().toISOString(),
    },
    ...importJobs,
  ];

  return ok(
    {
      total_rows: sheet.rows.length,
      deaneries_created: deaneriesCreated,
      parishes_created: parishesCreated,
      skipped_existing: skipped,
      failed_rows: failedRows.length,
      errors: failedRows.map((r) => ({ row_number: r.row_number, errors: r.errors })),
      error_file_base64: failedRows.length ? buildErrorCsv('org', failedRows) : null,
    },
    `Org import complete: ${deaneriesCreated} deaneries, ${parishesCreated} parishes created`
  );
};

export const mockListImportJobs = async () => {
  await delay();
  return ok({ jobs: clone(importJobs) }, 'Import jobs retrieved');
};
