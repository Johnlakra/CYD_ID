import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// apiClient.js calls axios.create() + registers interceptors at import time.
jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
    post: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
  };
  return { __esModule: true, default: { create: jest.fn(() => instance), get: jest.fn() } };
});

jest.mock('../api/anubhavApi', () => ({
  __esModule: true,
  getIndependents: jest.fn(),
  deleteIndependent: jest.fn(),
  createIndependent: jest.fn(),
  updateIndependent: jest.fn(),
  promoteIndependent: jest.fn(),
}));

// Keep the heavy ID-card renderer out of these unit tests.
jest.mock('../components/IDCard', () => () => <div data-testid="idcard" />);

import IndependentEntriesTab from './IndependentEntriesTab';
import * as api from '../api/anubhavApi';

const COMPLETE = {
  id: 1, name: 'Asha Masih', father_name: 'Joseph', date_of_birth: '2008-07-21',
  phone: '9711100000', deanery: 'Hoshiarpur', parish: 'Hoshiarpur', level: 'parish',
  designation: 'Member', postal_address: '12 Church Road', photo_url: 'https://x/p.png',
  is_independent: 1, place: 'phagwara', id_card_complete: true,
};
const INCOMPLETE = {
  id: 2, name: 'Rahul Singh', father_name: null, date_of_birth: null, phone: null,
  deanery: 'Moga', parish: 'Moga', level: null, designation: null, postal_address: null,
  photo_url: null, is_independent: 1, place: 'abohar', id_card_complete: false,
};

const listEnvelope = (independents) => ({
  success: true, message: 'OK',
  data: { place: null, independents, count: independents.length },
});

beforeEach(() => {
  jest.clearAllMocks();
  api.getIndependents.mockResolvedValue(listEnvelope([COMPLETE, INCOMPLETE]));
  api.promoteIndependent.mockResolvedValue({
    success: true, message: 'OK',
    data: {
      profile: { ...COMPLETE, is_independent: 0 },
      credentials: {
        username: 'asha2107',
        password_hint: 'phone number',
        message: "Password is the youth's phone number — share this so they can log in.",
      },
    },
  });
});

describe('IndependentEntriesTab', () => {
  test('renders independent entries with their ID-card status', async () => {
    render(<IndependentEntriesTab onLogout={jest.fn()} />);

    expect(await screen.findByText('Asha Masih')).toBeInTheDocument();
    expect(screen.getByText('Rahul Singh')).toBeInTheDocument();
    expect(screen.getByText('Ready for ID card')).toBeInTheDocument();
    // Incomplete row reports how many fields are missing.
    expect(screen.getByText(/Incomplete \(\d+\)/)).toBeInTheDocument();
  });

  test('print is disabled for incomplete entries, enabled for complete ones', async () => {
    render(<IndependentEntriesTab onLogout={jest.fn()} />);
    await screen.findByText('Asha Masih');

    expect(screen.getByLabelText('Print ID card for Asha Masih')).toBeEnabled();
    expect(screen.getByLabelText('Print ID card for Rahul Singh')).toBeDisabled();
  });

  test('promoting a complete entry shows the generated credentials', async () => {
    render(<IndependentEntriesTab onLogout={jest.fn()} />);
    await screen.findByText('Asha Masih');

    fireEvent.click(screen.getByLabelText('Promote Asha Masih'));
    // Promote dialog opens; its submit button is enabled because the row is complete.
    fireEvent.click(await screen.findByRole('button', { name: 'Promote' }));

    await waitFor(() => expect(api.promoteIndependent).toHaveBeenCalledWith(1, expect.any(Object)));
    expect(await screen.findByText('asha2107')).toBeInTheDocument();
    expect(screen.getByText(/Password is the youth's phone number/i)).toBeInTheDocument();
  });
});
