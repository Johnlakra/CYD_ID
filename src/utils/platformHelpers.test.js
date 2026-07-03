import {
  slugify,
  isValidSlug,
  isLegacyDiocese,
  isSuperAdmin,
  isNewDioceseAdmin,
  dioceseStatusChip,
  getSetupProgress,
  saveSetupProgress,
} from './platformHelpers';

describe('slugify', () => {
  test('converts a diocese name to a lowercase hyphenated slug', () => {
    expect(slugify('Diocese of Jalandhar')).toBe('diocese-of-jalandhar');
  });

  test('strips leading/trailing separators and collapses runs', () => {
    expect(slugify('  St.  Mary’s -- Diocese!  ')).toBe('st-mary-s-diocese');
  });

  test('returns empty string for empty/nullish input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('isValidSlug', () => {
  test('accepts lowercase letters, digits and hyphens', () => {
    expect(isValidSlug('jalandhar')).toBe(true);
    expect(isValidSlug('diocese-2')).toBe(true);
  });

  test('rejects uppercase, spaces, leading hyphen and single char', () => {
    expect(isValidSlug('Jalandhar')).toBe(false);
    expect(isValidSlug('two words')).toBe(false);
    expect(isValidSlug('-lead')).toBe(false);
    expect(isValidSlug('a')).toBe(false);
  });
});

describe('role/tenant gates', () => {
  test('legacy diocese covers missing, null and 1 diocese_id', () => {
    expect(isLegacyDiocese({ role: 'admin' })).toBe(true);
    expect(isLegacyDiocese({ role: 'admin', diocese_id: null })).toBe(true);
    expect(isLegacyDiocese({ role: 'admin', diocese_id: 1 })).toBe(true);
    expect(isLegacyDiocese({ role: 'admin', diocese_id: 2 })).toBe(false);
  });

  test('isSuperAdmin only matches the super_admin role', () => {
    expect(isSuperAdmin({ role: 'super_admin' })).toBe(true);
    expect(isSuperAdmin({ role: 'admin' })).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  test('isNewDioceseAdmin requires admin role AND a non-legacy diocese', () => {
    expect(isNewDioceseAdmin({ role: 'admin', diocese_id: 2 })).toBe(true);
    expect(isNewDioceseAdmin({ role: 'admin', diocese_id: 1 })).toBe(false);
    expect(isNewDioceseAdmin({ role: 'admin' })).toBe(false);
    expect(isNewDioceseAdmin({ role: 'user', diocese_id: 2 })).toBe(false);
  });
});

describe('dioceseStatusChip', () => {
  test('maps known statuses to chip props', () => {
    expect(dioceseStatusChip('pending')).toEqual({ label: 'Pending', color: 'warning' });
    expect(dioceseStatusChip('active')).toEqual({ label: 'Active', color: 'success' });
    expect(dioceseStatusChip('suspended')).toEqual({ label: 'Suspended', color: 'error' });
  });

  test('falls back to default color for unknown status', () => {
    expect(dioceseStatusChip('weird')).toEqual({ label: 'weird', color: 'default' });
  });
});

describe('setup progress storage', () => {
  beforeEach(() => localStorage.clear());

  test('returns a fresh progress object when nothing is stored', () => {
    expect(getSetupProgress(7)).toEqual({ completed: false, step: 0 });
  });

  test('round-trips progress per diocese', () => {
    saveSetupProgress(7, { completed: false, step: 2 });
    saveSetupProgress(8, { completed: true, step: 3 });
    expect(getSetupProgress(7)).toEqual({ completed: false, step: 2 });
    expect(getSetupProgress(8)).toEqual({ completed: true, step: 3 });
  });

  test('survives corrupted storage', () => {
    localStorage.setItem('platformSetup:9', '{not json');
    expect(getSetupProgress(9)).toEqual({ completed: false, step: 0 });
  });
});
