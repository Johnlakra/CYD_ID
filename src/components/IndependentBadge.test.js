import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IndependentBadge, { INDEPENDENT_COLOR, IndependentDot } from './IndependentBadge';

describe('IndependentBadge', () => {
  test('renders the "Independent" chip label', () => {
    render(<IndependentBadge />);
    expect(screen.getByText('Independent')).toBeInTheDocument();
  });

  test('exports the one agreed muted colour (blue-grey, not warning/purple)', () => {
    expect(INDEPENDENT_COLOR).toBe('#546e7a');
  });

  test('IndependentDot renders without crashing', () => {
    const { container } = render(<IndependentDot />);
    expect(container.firstChild).toBeTruthy();
  });
});
