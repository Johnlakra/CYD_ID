// Phase 4 — /idcard-templates mock: tenant scoping, resolve, CRUD, defaults.

import {
  __resetIdCardMock,
  mockCreateIdCardTemplate,
  mockDeleteIdCardTemplate,
  mockDuplicateIdCardTemplate,
  mockGetIdCardGallery,
  mockListIdCardTemplates,
  mockResolveIdCardTemplate,
  mockSetDefaultIdCardTemplate,
  mockUpdateIdCardTemplate,
} from './platformMockIdCards';

const loginAs = (dioceseId) =>
  localStorage.setItem('user', JSON.stringify({ diocese_id: dioceseId }));

const VALID_BODY = {
  level: 'parish',
  name: 'My parish card',
  background_url: 'data:image/png;base64,xyz',
  layout_json: { elements: [{ id: 'el_1', type: 'text', field: 'name', x: 0, y: 10, w: 50, h: 10 }] },
};

beforeEach(() => {
  __resetIdCardMock();
  localStorage.clear();
});

describe('idcard-templates mock', () => {
  test('diocese 1 lists the three seeded Jalandhar templates', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockListIdCardTemplates();

    // Assert
    expect(res.success).toBe(true);
    expect(res.data.templates.map((t) => t.level)).toEqual(['parish', 'deanery', 'dexco']);
    expect(res.data.templates.every((t) => t.is_default === 1)).toBe(true);
  });

  test('a fresh diocese starts with no templates', async () => {
    // Arrange
    loginAs(2);

    // Act
    const res = await mockListIdCardTemplates();

    // Assert
    expect(res.data.templates).toEqual([]);
  });

  test('gallery serves card dimensions and the four starters', async () => {
    // Act
    const res = await mockGetIdCardGallery();

    // Assert
    expect(res.data.card).toEqual({ width_mm: 146.3, height_mm: 221.8 });
    expect(res.data.templates).toHaveLength(4);
  });

  test('resolve returns the default template for the level, or null', async () => {
    // Arrange
    loginAs(1);

    // Act
    const hit = await mockResolveIdCardTemplate('parish');
    loginAs(2);
    const miss = await mockResolveIdCardTemplate('parish');

    // Assert
    expect(hit.data.template.name).toBe('Jalandhar Parish (legacy)');
    expect(miss.data.template).toBeNull();
  });

  test('create validates required fields', async () => {
    // Arrange
    loginAs(2);

    // Act
    const missingBg = await mockCreateIdCardTemplate({ ...VALID_BODY, background_url: null });
    const badLayout = await mockCreateIdCardTemplate({ ...VALID_BODY, layout_json: {} });

    // Assert
    expect(missingBg.success).toBe(false);
    expect(missingBg.status).toBe(400);
    expect(badLayout.success).toBe(false);
  });

  test('create → update round trip scoped to the diocese', async () => {
    // Arrange
    loginAs(2);

    // Act
    const created = await mockCreateIdCardTemplate(VALID_BODY);
    const updated = await mockUpdateIdCardTemplate(created.data.template.id, { name: 'Renamed' });

    // Assert
    expect(created.success).toBe(true);
    expect(created.data.template.is_default).toBe(0);
    expect(updated.data.template.name).toBe('Renamed');

    // Other dioceses cannot see it.
    loginAs(1);
    const foreign = await mockUpdateIdCardTemplate(created.data.template.id, { name: 'X' });
    expect(foreign.status).toBe(404);
  });

  test('set-default is exclusive per level', async () => {
    // Arrange
    loginAs(2);
    const first = await mockCreateIdCardTemplate(VALID_BODY);
    const second = await mockCreateIdCardTemplate({ ...VALID_BODY, name: 'Second' });

    // Act
    await mockSetDefaultIdCardTemplate(first.data.template.id);
    await mockSetDefaultIdCardTemplate(second.data.template.id);
    const list = await mockListIdCardTemplates();

    // Assert
    const defaults = list.data.templates.filter((t) => t.is_default === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('Second');
  });

  test('duplicate copies the layout with a new name and no default flag', async () => {
    // Arrange
    loginAs(1);

    // Act
    const res = await mockDuplicateIdCardTemplate(1);

    // Assert
    expect(res.data.template.name).toBe('Jalandhar Parish (legacy) (copy)');
    expect(res.data.template.is_default).toBe(0);
    expect(res.data.template.layout_json.elements.length).toBeGreaterThan(0);
  });

  test('delete is a soft delete and clears resolve', async () => {
    // Arrange
    loginAs(1);

    // Act
    const del = await mockDeleteIdCardTemplate(1);
    const list = await mockListIdCardTemplates();
    const resolved = await mockResolveIdCardTemplate('parish');

    // Assert
    expect(del.success).toBe(true);
    expect(list.data.templates.map((t) => t.level)).toEqual(['deanery', 'dexco']);
    expect(resolved.data.template).toBeNull();
  });
});
