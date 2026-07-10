import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionMatrix from './PermissionMatrix';
import * as platformApi from '../../api/platformApi';

// apiClient.js calls axios.create() + registers interceptors at import time.
jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
    post: jest.fn(() => Promise.reject(new Error('network disabled in test'))),
  };
  return { __esModule: true, default: { create: jest.fn(() => instance), get: jest.fn() } };
});

jest.mock('../../api/platformApi', () => ({
  __esModule: true,
  getPermissionMatrix: jest.fn(),
  setRolePermissions: jest.fn(),
  createRole: jest.fn(),
  duplicateRole: jest.fn(),
  deleteRole: jest.fn(),
  getUserAccess: jest.fn(),
  assignUserRole: jest.fn(),
  removeUserRole: jest.fn(),
  setUserOverride: jest.fn(),
}));

jest.mock('../../api/anubhavApi', () => ({
  __esModule: true,
  searchUsers: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const matrixData = {
  permissions: [
    { id: 1, perm_key: 'events.view', module: 'events', label: 'View events' },
    { id: 2, perm_key: 'events.manage', module: 'events', label: 'Manage events' },
    { id: 3, perm_key: 'ui.tab.events', module: 'ui', label: 'Show Events tab' },
  ],
  roles: [
    { id: 1, role_key: 'admin', label: 'Administrator', is_system: 1 },
    { id: 2, role_key: 'event_loc', label: 'Event LOC', is_system: 1 },
  ],
  grid: { 1: [], 2: ['events.view'] },
};

describe('PermissionMatrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformApi.getPermissionMatrix.mockResolvedValue({
      success: true,
      data: JSON.parse(JSON.stringify(matrixData)),
    });
  });

  test('renders module groups and role columns', async () => {
    render(<PermissionMatrix onLogout={jest.fn()} />);

    expect(await screen.findByText('View events')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Event LOC')).toBeInTheDocument();
    expect(screen.getByText('UI Visibility (tabs & buttons)')).toBeInTheDocument();
  });

  test('toggling a checkbox saves the full new key set for the role', async () => {
    platformApi.setRolePermissions.mockResolvedValue({
      success: true,
      data: { id: 2, permissions: ['events.manage', 'events.view'] },
    });
    render(<PermissionMatrix onLogout={jest.fn()} />);
    await screen.findByText('View events');

    // Act — grant events.manage to Event LOC.
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Event LOC — events.manage' })
    );

    // Assert
    await waitFor(() =>
      expect(platformApi.setRolePermissions).toHaveBeenCalledWith(2, [
        'events.manage',
        'events.view',
      ])
    );
  });

  test('admin system role checkboxes are locked on', async () => {
    render(<PermissionMatrix onLogout={jest.fn()} />);
    await screen.findByText('View events');

    const adminBox = screen.getByRole('checkbox', {
      name: 'Administrator — events.view',
    });
    expect(adminBox).toBeChecked();
    expect(adminBox).toBeDisabled();
  });

  test('failed save reverts the optimistic toggle', async () => {
    platformApi.setRolePermissions.mockResolvedValue({
      success: false,
      message: 'nope',
      data: null,
    });
    render(<PermissionMatrix onLogout={jest.fn()} />);
    await screen.findByText('View events');

    const box = screen.getByRole('checkbox', { name: 'Event LOC — events.view' });
    expect(box).toBeChecked();
    fireEvent.click(box);

    await waitFor(() =>
      expect(platformApi.setRolePermissions).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'Event LOC — events.view' })
      ).toBeChecked()
    );
  });

  test('search filters the permission rows', async () => {
    render(<PermissionMatrix onLogout={jest.fn()} />);
    await screen.findByText('View events');

    fireEvent.change(screen.getByPlaceholderText('Search permissions'), {
      target: { value: 'ui.tab' },
    });

    expect(screen.queryByText('View events')).not.toBeInTheDocument();
    expect(screen.getByText('Show Events tab')).toBeInTheDocument();
  });
});
