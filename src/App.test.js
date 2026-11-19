import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

test('shows the login form when nobody is signed in', () => {
  render(<App />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});
