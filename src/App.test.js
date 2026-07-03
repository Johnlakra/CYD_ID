import { render, screen } from '@testing-library/react';
import App from './App';

// apiClient.js calls axios.create() + registers interceptors at import time.
// jest.mock is hoisted above the imports by babel-jest.
jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
    post: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
  };
  return { __esModule: true, default: { create: jest.fn(() => instance), get: jest.fn(), post: jest.fn() } };
});

test('renders the sign-in screen when logged out', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});

test('offers the diocese registration entry on the login screen', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /register your diocese/i })).toBeInTheDocument();
});
