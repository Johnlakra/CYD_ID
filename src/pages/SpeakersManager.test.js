import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Keep the real axios off the network. apiClient.js calls axios.create() and
// registers interceptors at import time, and Dashboard calls axios.get for
// stats — both must resolve without a real request.
jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
    post: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
  };
  const mockAxios = {
    create: jest.fn(() => instance),
    get: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
  };
  return { __esModule: true, default: mockAxios };
});

// Mock the API facade so component behaviour is deterministic (no mock-store
// coupling). Shapes mirror API_CONTRACT.md exactly.
jest.mock('../api/anubhavApi', () => ({
  __esModule: true,
  listSpeakers: jest.fn(),
  createSpeaker: jest.fn(),
  updateSpeaker: jest.fn(),
  deleteSpeaker: jest.fn(),
  getMyRole: jest.fn(),
  getTimetableLive: jest.fn(),
}));

import SpeakersManager from './SpeakersManager';
import Dashboard from '../components/Dashboard';
import * as api from '../api/anubhavApi';

const SEED_SPEAKER = {
  id: 1,
  place: 'phagwara',
  name: 'Fr. Thomas',
  role: 'Retreat Preacher',
  bio: 'Leading the Phagwara sessions.',
  photo_url: null,
  sort_order: 1,
  status: 1,
};

const listEnvelope = (speakers) => ({
  success: true,
  message: 'OK',
  data: { speakers, count: speakers.length },
});

beforeEach(() => {
  jest.clearAllMocks();
  api.listSpeakers.mockResolvedValue(listEnvelope([SEED_SPEAKER]));
  api.createSpeaker.mockResolvedValue({ success: true, message: 'OK', data: { speaker: { ...SEED_SPEAKER, id: 9 } } });
  api.updateSpeaker.mockResolvedValue({ success: true, message: 'OK', data: { speaker: SEED_SPEAKER } });
  api.deleteSpeaker.mockResolvedValue({ success: true, message: 'OK', data: { speaker: { ...SEED_SPEAKER, status: 0 } } });
  api.getMyRole.mockResolvedValue({ success: true, message: 'OK', data: { event_role: 'dexco', loc_place: null } });
  api.getTimetableLive.mockResolvedValue({ success: true, message: 'OK', data: { now: null, next: null } });
});

describe('SpeakersManager', () => {
  test('renders the speaker list from the API in the Manage tab', async () => {
    render(<SpeakersManager onLogout={jest.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /manage speakers/i }));

    expect(await screen.findByText('Fr. Thomas')).toBeInTheDocument();
    expect(screen.getByText('Retreat Preacher')).toBeInTheDocument();
  });

  test('create flow posts the new speaker', async () => {
    render(<SpeakersManager onLogout={jest.fn()} />);
    await waitFor(() => expect(api.listSpeakers).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText(/^role/i), { target: { value: 'Host' } });
    fireEvent.click(screen.getByRole('button', { name: /add speaker/i }));

    await waitFor(() =>
      expect(api.createSpeaker).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Person', role: 'Host' })
      )
    );
  });

  test('delete asks for confirmation, then calls deleteSpeaker', async () => {
    render(<SpeakersManager onLogout={jest.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /manage speakers/i }));

    fireEvent.click(await screen.findByLabelText('Delete Fr. Thomas'));

    // Confirm dialog appears with the spec wording.
    expect(
      await screen.findByText(/Delete Fr\. Thomas\? They will no longer appear on the website\./i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(api.deleteSpeaker).toHaveBeenCalledWith(1));
  });
});

describe('Speakers menu role gate', () => {
  test('LOC does not see the Speakers menu item', async () => {
    api.getMyRole.mockResolvedValue({ success: true, message: 'OK', data: { event_role: 'loc', loc_place: 'phagwara' } });

    render(<Dashboard authToken="x" user={{ username: 't', role: 'user' }} onLogout={jest.fn()} />);

    // Anubhav menu appears once the role resolves — proves the gate ran.
    await screen.findByText('Anubhav 2026');
    expect(screen.queryByText('Speakers')).toBeNull();
  });

  test('DEXCO sees the Speakers menu item', async () => {
    api.getMyRole.mockResolvedValue({ success: true, message: 'OK', data: { event_role: 'dexco', loc_place: null } });

    render(<Dashboard authToken="x" user={{ username: 't', role: 'user' }} onLogout={jest.fn()} />);

    expect(await screen.findByText('Speakers')).toBeInTheDocument();
  });
});
