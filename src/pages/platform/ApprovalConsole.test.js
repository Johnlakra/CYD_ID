import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApprovalConsole from './ApprovalConsole';
import * as platformApi from '../../api/platformApi';

// apiClient.js calls axios.create() + registers interceptors at import time.
// jest.mock is hoisted above the imports by babel-jest.
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
  listDioceses: jest.fn(),
  approveDiocese: jest.fn(),
  suspendDiocese: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const pendingDiocese = {
  id: 2,
  name: 'Diocese of Shimla and Chandigarh',
  slug: 'shimla-chandigarh',
  logo_url: null,
  contact_email: 'youth@shimlachd.org',
  contact_phone: '9800000002',
  address: 'Catholic Church, Chandigarh',
  status: 'pending',
  created_at: '2026-06-28T10:30:00.000Z',
};

describe('ApprovalConsole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformApi.listDioceses.mockResolvedValue({
      success: true,
      data: { dioceses: [pendingDiocese] },
    });
  });

  test('lists pending dioceses by default', async () => {
    render(<ApprovalConsole onLogout={jest.fn()} />);
    expect(
      await screen.findByText('Diocese of Shimla and Chandigarh')
    ).toBeInTheDocument();
    expect(platformApi.listDioceses).toHaveBeenCalledWith({ status: 'pending' });
  });

  test('approve flow confirms and then shows the admin credentials once', async () => {
    platformApi.approveDiocese.mockResolvedValue({
      success: true,
      data: {
        id: 2,
        slug: 'shimla-chandigarh',
        status: 'active',
        admin: {
          username: 'shimla-chandigarh.admin',
          created: true,
          password_hint: 'registered contact phone',
        },
      },
    });

    render(<ApprovalConsole onLogout={jest.fn()} />);
    await screen.findByText('Diocese of Shimla and Chandigarh');

    fireEvent.click(screen.getByLabelText(/approve & activate/i));
    expect(await screen.findByText('Approve diocese?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    expect(await screen.findByText('Diocese activated')).toBeInTheDocument();
    expect(screen.getByText('shimla-chandigarh.admin')).toBeInTheDocument();
    expect(platformApi.approveDiocese).toHaveBeenCalledWith(2);
  });

  test('reject (suspend) flow confirms before calling the API', async () => {
    platformApi.suspendDiocese.mockResolvedValue({
      success: true,
      data: { id: 2, status: 'suspended' },
    });

    render(<ApprovalConsole onLogout={jest.fn()} />);
    await screen.findByText('Diocese of Shimla and Chandigarh');

    fireEvent.click(screen.getByLabelText(/reject \(suspend\)/i));
    expect(await screen.findByText('Reject registration?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    await waitFor(() => expect(platformApi.suspendDiocese).toHaveBeenCalledWith(2));
  });

  test('shows an empty state when there is nothing pending', async () => {
    platformApi.listDioceses.mockResolvedValue({
      success: true,
      data: { dioceses: [] },
    });
    render(<ApprovalConsole onLogout={jest.fn()} />);
    expect(await screen.findByText(/no pending dioceses/i)).toBeInTheDocument();
  });
});
