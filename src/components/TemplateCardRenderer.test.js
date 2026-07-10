// Phase 4 — shared renderer: legacy-equivalent text formatting and element
// rendering for the template-driven card path.

import { render, screen } from '@testing-library/react';
import TemplateCardRenderer, {
  resolveElementText,
  resolveFieldValue,
} from './TemplateCardRenderer';
import { buildJalandharLayout } from '../utils/idCardSeeds';

const DATA = {
  name: 'john doe',
  designation: 'Youth Member',
  deanery: 'Central',
  parish: 'St. Peter',
  date_of_baptism: '2004-08-15',
  date_of_birth: '2004-05-02',
  phone: '9800000000',
  father_name: 'Sam Doe',
  postal_address: '12 Church Road',
  issue_date: '2026-07-01',
  photo: 'photo.jpg',
};

describe('resolveFieldValue', () => {
  test('capitalises the name like the legacy card', () => {
    expect(resolveFieldValue(DATA, 'name')).toBe('John Doe');
  });

  test('formats dates as DD-MM-YYYY like the legacy card', () => {
    expect(resolveFieldValue(DATA, 'date_of_birth')).toBe('02-05-2004');
    expect(resolveFieldValue(DATA, 'issue_date')).toBe('01-07-2026');
  });

  test('returns empty string for missing values', () => {
    expect(resolveFieldValue({}, 'phone')).toBe('');
    expect(resolveFieldValue(DATA, undefined)).toBe('');
  });
});

describe('resolveElementText', () => {
  test('joins the label prefix like the legacy ": value" rows', () => {
    // Arrange
    const element = { type: 'text', field: 'deanery', label: ':' };

    // Assert
    expect(resolveElementText(element, DATA)).toBe(': Central');
  });

  test('static_text renders its label only', () => {
    expect(resolveElementText({ type: 'static_text', label: 'Valid for two years' }, DATA)).toBe(
      'Valid for two years'
    );
  });

  test('uppercase flag transforms the output', () => {
    expect(resolveElementText({ type: 'text', field: 'parish', uppercase: true }, DATA)).toBe(
      'ST. PETER'
    );
  });
});

describe('TemplateCardRenderer', () => {
  const template = {
    background_url: 'bg.jpg',
    width_mm: 146.3,
    height_mm: 221.8,
    layout_json: buildJalandharLayout(),
  };

  test('renders every Jalandhar element with legacy formatting', () => {
    // Act
    render(<TemplateCardRenderer template={template} data={DATA} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(': Central')).toBeInTheDocument();
    expect(screen.getByText(': 02-05-2004')).toBeInTheDocument();
    expect(screen.getByText('Issued: 01-07-2026')).toBeInTheDocument();
    expect(screen.getByText('Valid for two years')).toBeInTheDocument();
  });

  test('renders the profile photo', () => {
    // Act
    const { container } = render(<TemplateCardRenderer template={template} data={DATA} />);

    // Assert
    const photo = container.querySelector('img[src="photo.jpg"]');
    expect(photo).not.toBeNull();
  });

  test('qr elements render a placeholder until Phase 6 wires the payload', () => {
    // Arrange
    const qrTemplate = {
      background_url: 'bg.jpg',
      layout_json: { elements: [{ id: 'el_1', type: 'qr', x: 10, y: 10, w: 30, h: 30 }] },
    };

    // Act
    render(<TemplateCardRenderer template={qrTemplate} data={DATA} />);

    // Assert
    expect(screen.getByText('QR')).toBeInTheDocument();
  });
});
