import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DioceseRegistration from './DioceseRegistration';
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
  registerDiocese: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const fillField = (label, value) => {
  fireEvent.change(screen.getByLabelText(new RegExp(label, 'i')), {
    target: { value },
  });
};

describe('DioceseRegistration', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders the registration form', () => {
    render(<DioceseRegistration onBackToLogin={jest.fn()} />);
    expect(screen.getByText('Register your diocese')).toBeInTheDocument();
    expect(screen.getByLabelText(/diocese name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
  });

  test('auto-derives the slug from the diocese name', () => {
    render(<DioceseRegistration onBackToLogin={jest.fn()} />);
    fillField('diocese name', 'Diocese of Shimla');
    expect(screen.getByLabelText(/url slug/i)).toHaveValue('diocese-of-shimla');
  });

  test('shows validation errors and does not submit an invalid form', async () => {
    render(<DioceseRegistration onBackToLogin={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/valid contact email/i)).toBeInTheDocument();
    expect(platformApi.registerDiocese).not.toHaveBeenCalled();
  });

  test('submits a valid form and shows the pending confirmation', async () => {
    platformApi.registerDiocese.mockResolvedValue({
      success: true,
      data: { id: 3, name: 'Diocese of Shimla', slug: 'diocese-of-shimla', status: 'pending' },
    });

    render(<DioceseRegistration onBackToLogin={jest.fn()} />);
    fillField('diocese name', 'Diocese of Shimla');
    fillField('contact email', 'youth@shimla.org');
    fillField('contact phone', '9876543210');
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/registration submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/diocese-of-shimla\.admin/)).toBeInTheDocument();
    expect(platformApi.registerDiocese).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Diocese of Shimla',
        slug: 'diocese-of-shimla',
        contact_email: 'youth@shimla.org',
        contact_phone: '9876543210',
      })
    );
  });

  test('surfaces a duplicate-slug 409 as a slug field error', async () => {
    platformApi.registerDiocese.mockResolvedValue({
      success: false,
      status: 409,
      message: 'A diocese with this slug is already registered',
    });

    render(<DioceseRegistration onBackToLogin={jest.fn()} />);
    fillField('diocese name', 'Diocese of Shimla');
    fillField('contact email', 'youth@shimla.org');
    fillField('contact phone', '9876543210');
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(
      await screen.findByText(/already registered/i)
    ).toBeInTheDocument();
  });

  test('back link calls onBackToLogin', () => {
    const onBack = jest.fn();
    render(<DioceseRegistration onBackToLogin={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
