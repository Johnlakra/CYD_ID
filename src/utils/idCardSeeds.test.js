// Phase 4 — seed layouts: the Jalandhar transcription must keep the exact
// legacy IDCard.jsx values (pixel-parity exit criterion for diocese 1).

import { buildJalandharLayout, GALLERY_STARTERS } from './idCardSeeds';
import { CARD_WIDTH_MM, isValidLayout } from './idCardLayout';

const byField = (layout, field) => layout.elements.find((el) => el.field === field);

describe('buildJalandharLayout', () => {
  test('photo box matches the legacy geometry', () => {
    // Arrange
    const layout = buildJalandharLayout();

    // Act
    const photo = layout.elements.find((el) => el.type === 'photo');

    // Assert — legacy: top 42.5mm, 58x67mm, centred, radius 14, grey border.
    expect(photo).toMatchObject({
      y: 42.5,
      w: 58,
      h: 67,
      border: '1px solid #8D8D8D',
      borderRadius: 14,
    });
    expect(photo.x).toBeCloseTo((CARD_WIDTH_MM - 58) / 2, 2);
  });

  test('name uses the legacy Vidaloka styling, centred', () => {
    // Arrange / Act
    const name = byField(buildJalandharLayout(), 'name');

    // Assert — legacy: top 111.2mm, 31.5px Vidaloka #C01E2C centred.
    expect(name).toMatchObject({
      y: 111.2,
      fontSize: 31.5,
      fontFamily: 'Vidaloka',
      color: '#C01E2C',
      align: 'center',
    });
  });

  test('detail rows keep the legacy 54mm column and Gafata 24.2px', () => {
    // Arrange
    const layout = buildJalandharLayout();
    const expectedTops = {
      deanery: 128,
      parish: 136.1,
      date_of_baptism: 144.12,
      date_of_birth: 152.4,
      phone: 160.68,
      father_name: 168.96,
    };

    // Act / Assert
    Object.entries(expectedTops).forEach(([field, top]) => {
      expect(byField(layout, field)).toMatchObject({
        x: 54,
        y: top,
        fontSize: 24.2,
        fontFamily: 'Gafata',
        color: '#000000',
        label: ':',
      });
    });
  });

  test('address block wraps with the legacy 96.5% line height', () => {
    // Arrange / Act
    const address = byField(buildJalandharLayout(), 'postal_address');

    // Assert
    expect(address).toMatchObject({ x: 56.9, y: 177.5, w: 82, wrap: true, lineHeight: '96.5%' });
  });

  test('footer keeps issue date left and validity right in the same band', () => {
    // Arrange
    const layout = buildJalandharLayout();

    // Act
    const issued = byField(layout, 'issue_date');
    const validity = layout.elements.find((el) => el.label === 'Valid for two years');

    // Assert
    expect(issued).toMatchObject({ y: 213, align: 'left', label: 'Issued:', color: '#fff' });
    expect(validity).toMatchObject({ y: 213, align: 'right', color: '#fff' });
    expect(issued.x).toBe(validity.x);
  });
});

describe('GALLERY_STARTERS', () => {
  test('serves four named starters with valid layouts', () => {
    // Assert
    expect(GALLERY_STARTERS.map((s) => s.key)).toEqual([
      'classic',
      'modern',
      'minimal',
      'photo-left',
    ]);
    GALLERY_STARTERS.forEach((starter) => {
      expect(isValidLayout(starter.layout_json)).toBe(true);
      expect(starter.layout_json.elements.length).toBeGreaterThan(0);
    });
  });

  test('classic starter is the Jalandhar transcription', () => {
    // Assert
    expect(GALLERY_STARTERS[0].layout_json).toEqual(buildJalandharLayout());
  });
});
