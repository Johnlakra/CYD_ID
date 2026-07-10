import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Can from './Can';
import { clearPermissionsCache } from '../utils/usePermissions';
import * as platformApi from '../api/platformApi';

jest.mock('../api/platformApi', () => ({
  __esModule: true,
  getMyPermissions: jest.fn(),
}));

describe('<Can>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPermissionsCache();
  });

  test('renders children when the key is held', async () => {
    // Arrange
    platformApi.getMyPermissions.mockResolvedValue({
      success: true,
      data: { permissions: ['events.create'] },
    });

    // Act
    render(
      <Can perm="events.create">
        <button>Create event</button>
      </Can>
    );

    // Assert
    expect(await screen.findByText('Create event')).toBeInTheDocument();
  });

  test('renders fallback when the key is missing', async () => {
    // Arrange
    platformApi.getMyPermissions.mockResolvedValue({
      success: true,
      data: { permissions: ['events.view'] },
    });

    // Act
    render(
      <Can perm="events.create" fallback={<span>read only</span>}>
        <button>Create event</button>
      </Can>
    );

    // Assert
    expect(await screen.findByText('read only')).toBeInTheDocument();
    expect(screen.queryByText('Create event')).not.toBeInTheDocument();
  });

  test('array prop grants access when ANY key is held', async () => {
    // Arrange
    platformApi.getMyPermissions.mockResolvedValue({
      success: true,
      data: { permissions: ['imports.run'] },
    });

    // Act
    render(
      <Can perm={['org.manage', 'imports.run']}>
        <span>bulk tools</span>
      </Can>
    );

    // Assert
    expect(await screen.findByText('bulk tools')).toBeInTheDocument();
  });

  test('hides children when permission resolution fails', async () => {
    // Arrange
    platformApi.getMyPermissions.mockResolvedValue({
      success: false,
      message: 'boom',
      data: null,
    });

    // Act
    render(
      <Can perm="events.create">
        <button>Create event</button>
      </Can>
    );

    // Assert — resolution failure narrows to "no permissions".
    await waitFor(() =>
      expect(platformApi.getMyPermissions).toHaveBeenCalledTimes(1)
    );
    expect(screen.queryByText('Create event')).not.toBeInTheDocument();
  });
});
