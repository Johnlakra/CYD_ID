import {
  PERM,
  PERMISSION_CATALOG,
  groupByModule,
  isValidRoleKey,
  matchesPermissionSearch,
  toggleKey,
} from './permissionKeys';

describe('permissionKeys registry', () => {
  test('catalog has unique keys and every PERM constant is present', () => {
    // Arrange
    const keys = PERMISSION_CATALOG.map((p) => p.perm_key);

    // Act
    const unique = new Set(keys);

    // Assert
    expect(unique.size).toBe(keys.length);
    for (const value of Object.values(PERM)) {
      expect(unique.has(value)).toBe(true);
    }
  });
});

describe('groupByModule', () => {
  test('groups permissions preserving catalog order', () => {
    // Arrange
    const rows = [
      { perm_key: 'a.one', module: 'a' },
      { perm_key: 'b.one', module: 'b' },
      { perm_key: 'a.two', module: 'a' },
    ];

    // Act
    const groups = groupByModule(rows);

    // Assert
    expect(groups.map((g) => g.module)).toEqual(['a', 'b']);
    expect(groups[0].permissions).toHaveLength(2);
  });

  test('returns empty array for empty or missing input', () => {
    expect(groupByModule([])).toEqual([]);
    expect(groupByModule(undefined)).toEqual([]);
  });
});

describe('toggleKey', () => {
  test('adds a missing key without mutating the original array', () => {
    // Arrange
    const original = ['events.view'];

    // Act
    const next = toggleKey(original, 'events.manage');

    // Assert
    expect(next).toEqual(['events.manage', 'events.view']);
    expect(original).toEqual(['events.view']);
  });

  test('removes a present key', () => {
    expect(toggleKey(['events.view', 'events.manage'], 'events.view')).toEqual([
      'events.manage',
    ]);
  });
});

describe('matchesPermissionSearch', () => {
  const permission = { perm_key: 'ui.tab.events', label: 'Show Events tab' };

  test('matches on key, label, and empty search', () => {
    expect(matchesPermissionSearch(permission, 'ui.tab')).toBe(true);
    expect(matchesPermissionSearch(permission, 'Events tab')).toBe(true);
    expect(matchesPermissionSearch(permission, '')).toBe(true);
  });

  test('rejects non-matching terms', () => {
    expect(matchesPermissionSearch(permission, 'accommodation')).toBe(false);
  });
});

describe('isValidRoleKey', () => {
  test('accepts backend-legal keys and rejects the rest', () => {
    expect(isValidRoleKey('parish_president')).toBe(true);
    expect(isValidRoleKey('a')).toBe(false);
    expect(isValidRoleKey('Bad-Key')).toBe(false);
    expect(isValidRoleKey('')).toBe(false);
  });
});
