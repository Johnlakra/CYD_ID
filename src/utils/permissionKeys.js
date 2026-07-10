// Multi-diocese platform — canonical permission-key registry (Phase 3).
// Mirrors the backend seed (scripts/migrations/104_platform_permissions.sql)
// verbatim. Two kinds of keys: `resource.action` (API enforcement) and `ui.*`
// (tab/button visibility). The live catalog always comes from
// GET /permissions/catalog — this registry seeds the mock layer and gives the
// FE stable constants so gated components never hardcode raw strings.

export const PERM = {
  PROFILES_VIEW: 'profiles.view',
  PROFILES_CREATE: 'profiles.create',
  PROFILES_UPDATE: 'profiles.update',
  PROFILES_DELETE: 'profiles.delete',
  INDEPENDENTS_CREATE: 'independents.create',
  INDEPENDENTS_MANAGE: 'independents.manage',
  IDCARDS_VIEW: 'idcards.view',
  IDCARDS_GENERATE: 'idcards.generate',
  IDCARDS_DESIGN: 'idcards.design',
  ORG_VIEW: 'org.view',
  ORG_MANAGE: 'org.manage',
  IMPORTS_RUN: 'imports.run',
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_MANAGE: 'events.manage',
  EVENTS_SCAN_REGISTER: 'events.scan_register',
  PERMISSIONS_MANAGE: 'permissions.manage',
  PLATFORM_MANAGE_DIOCESES: 'platform.manage_dioceses',
  UI_TAB_PROFILES: 'ui.tab.profiles',
  UI_TAB_IDCARDS: 'ui.tab.idcards',
  UI_TAB_EVENTS: 'ui.tab.events',
  UI_TAB_ACCOMMODATION: 'ui.tab.accommodation',
  UI_TAB_TIMETABLE: 'ui.tab.timetable',
  UI_TAB_SPEAKERS: 'ui.tab.speakers',
  UI_TAB_ANNOUNCEMENTS: 'ui.tab.announcements',
  UI_TAB_ORG: 'ui.tab.org',
  UI_TAB_IMPORTS: 'ui.tab.imports',
  UI_TAB_PERMISSIONS: 'ui.tab.permissions',
  UI_BUTTON_EXPORT_XLSX: 'ui.button.export_xlsx',
  UI_BUTTON_BULK_IMPORT: 'ui.button.bulk_import',
};

// perm_key/module/label rows exactly as seeded on the backend.
export const PERMISSION_CATALOG = [
  { perm_key: PERM.PROFILES_VIEW, module: 'profiles', label: 'View profiles' },
  { perm_key: PERM.PROFILES_CREATE, module: 'profiles', label: 'Create profiles' },
  { perm_key: PERM.PROFILES_UPDATE, module: 'profiles', label: 'Update profiles' },
  { perm_key: PERM.PROFILES_DELETE, module: 'profiles', label: 'Delete profiles' },
  { perm_key: PERM.INDEPENDENTS_CREATE, module: 'profiles', label: 'Create independent entries' },
  { perm_key: PERM.INDEPENDENTS_MANAGE, module: 'profiles', label: 'Manage independent entries' },
  { perm_key: PERM.IDCARDS_VIEW, module: 'idcards', label: 'View ID cards' },
  { perm_key: PERM.IDCARDS_GENERATE, module: 'idcards', label: 'Generate ID cards' },
  { perm_key: PERM.IDCARDS_DESIGN, module: 'idcards', label: 'Design ID card templates' },
  { perm_key: PERM.ORG_VIEW, module: 'org', label: 'View org structure' },
  { perm_key: PERM.ORG_MANAGE, module: 'org', label: 'Manage deaneries and parishes' },
  { perm_key: PERM.IMPORTS_RUN, module: 'imports', label: 'Run bulk imports' },
  { perm_key: PERM.EVENTS_VIEW, module: 'events', label: 'View events' },
  { perm_key: PERM.EVENTS_CREATE, module: 'events', label: 'Create events' },
  { perm_key: PERM.EVENTS_MANAGE, module: 'events', label: 'Manage events' },
  { perm_key: PERM.EVENTS_SCAN_REGISTER, module: 'events', label: 'Scan-desk instant registration' },
  { perm_key: PERM.PERMISSIONS_MANAGE, module: 'platform', label: 'Manage roles and permissions' },
  { perm_key: PERM.PLATFORM_MANAGE_DIOCESES, module: 'platform', label: 'Manage diocese onboarding' },
  { perm_key: PERM.UI_TAB_PROFILES, module: 'ui', label: 'Show Profiles tab' },
  { perm_key: PERM.UI_TAB_IDCARDS, module: 'ui', label: 'Show ID Cards tab' },
  { perm_key: PERM.UI_TAB_EVENTS, module: 'ui', label: 'Show Events tab' },
  { perm_key: PERM.UI_TAB_ACCOMMODATION, module: 'ui', label: 'Show Accommodation tab' },
  { perm_key: PERM.UI_TAB_TIMETABLE, module: 'ui', label: 'Show Timetable tab' },
  { perm_key: PERM.UI_TAB_SPEAKERS, module: 'ui', label: 'Show Speakers tab' },
  { perm_key: PERM.UI_TAB_ANNOUNCEMENTS, module: 'ui', label: 'Show Announcements tab' },
  { perm_key: PERM.UI_TAB_ORG, module: 'ui', label: 'Show Org Structure tab' },
  { perm_key: PERM.UI_TAB_IMPORTS, module: 'ui', label: 'Show Imports tab' },
  { perm_key: PERM.UI_TAB_PERMISSIONS, module: 'ui', label: 'Show Permissions tab' },
  { perm_key: PERM.UI_BUTTON_EXPORT_XLSX, module: 'ui', label: 'Show Export to Excel button' },
  { perm_key: PERM.UI_BUTTON_BULK_IMPORT, module: 'ui', label: 'Show Bulk Import button' },
];

export const MODULE_LABELS = {
  profiles: 'Profiles',
  idcards: 'ID Cards',
  org: 'Organisation',
  imports: 'Imports',
  events: 'Events',
  platform: 'Platform',
  ui: 'UI Visibility (tabs & buttons)',
};

export const moduleLabel = (module) => MODULE_LABELS[module] || module;

// Mirrors the backend role_key rule (controllers/permissionController.js).
export const ROLE_KEY_PATTERN = /^[a-z0-9_]{2,60}$/;

export const isValidRoleKey = (roleKey) => ROLE_KEY_PATTERN.test(String(roleKey || ''));

// [{ perm_key, module, ... }] -> [{ module, permissions: [...] }] in catalog order.
export const groupByModule = (permissions) => {
  const order = [];
  const byModule = {};
  for (const permission of permissions || []) {
    if (!byModule[permission.module]) {
      byModule[permission.module] = [];
      order.push(permission.module);
    }
    byModule[permission.module].push(permission);
  }
  return order.map((module) => ({ module, permissions: byModule[module] }));
};

// Immutable toggle: returns a NEW sorted array with the key added or removed.
export const toggleKey = (keys, permKey) => {
  const current = Array.isArray(keys) ? keys : [];
  return current.includes(permKey)
    ? current.filter((key) => key !== permKey)
    : [...current, permKey].sort();
};

// Case-insensitive match on key or label for the matrix search box.
export const matchesPermissionSearch = (permission, search) => {
  const term = String(search || '').trim().toLowerCase();
  if (!term) return true;
  return (
    String(permission.perm_key || '').toLowerCase().includes(term) ||
    String(permission.label || '').toLowerCase().includes(term)
  );
};
