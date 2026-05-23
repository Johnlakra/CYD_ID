// Anubhav 2026 — API facade for Phase 1.
// When REACT_APP_ANUBHAV_MOCK !== 'false', all calls hit the in-memory mock
// layer. Otherwise they hit the real backend via the shared apiClient (which
// already attaches the Bearer token).

import apiClient from './apiClient';
import {
  mockGetMyRole,
  mockGetEligible,
  mockGetRegistrations,
  mockCreateRegistration,
  mockDeleteRegistration,
  mockGetChaperones,
  mockCreateChaperone,
  mockGetFees,
} from './anubhavMock';

const USE_MOCK = process.env.REACT_APP_ANUBHAV_MOCK !== 'false';

const ROUTES = {
  role: '/anubhav/me/role',
  eligible: '/anubhav/eligible',
  registrations: '/anubhav/registrations',
  registrationById: (id) => `/anubhav/registrations/${id}`,
  chaperones: '/anubhav/chaperones',
  fees: '/anubhav/fees',
};

// Normalize axios -> standard envelope shape so callers only handle one shape.
const unwrap = (axiosResponse) => {
  const body = axiosResponse && axiosResponse.data;
  if (body && typeof body === 'object' && 'success' in body) {
    return body;
  }
  return { success: true, message: 'OK', data: body };
};

const errorEnvelope = (error) => ({
  success: false,
  message:
    (error && error.response && error.response.data && error.response.data.message) ||
    (error && error.message) ||
    'Request failed',
  data: null,
  status: error && error.response ? error.response.status : undefined,
});

export const getMyRole = async () => {
  if (USE_MOCK) return mockGetMyRole();
  try {
    return unwrap(await apiClient.get(ROUTES.role));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getEligible = async (params) => {
  if (USE_MOCK) return mockGetEligible(params);
  try {
    return unwrap(await apiClient.get(ROUTES.eligible, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getRegistrations = async (params) => {
  if (USE_MOCK) return mockGetRegistrations(params);
  try {
    return unwrap(await apiClient.get(ROUTES.registrations, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createRegistration = async (body) => {
  if (USE_MOCK) return mockCreateRegistration(body);
  try {
    return unwrap(await apiClient.post(ROUTES.registrations, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteRegistration = async (id) => {
  if (USE_MOCK) return mockDeleteRegistration(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.registrationById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getChaperones = async (params) => {
  if (USE_MOCK) return mockGetChaperones(params);
  try {
    return unwrap(await apiClient.get(ROUTES.chaperones, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createChaperone = async (body) => {
  if (USE_MOCK) return mockCreateChaperone(body);
  try {
    return unwrap(await apiClient.post(ROUTES.chaperones, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getFees = async (params) => {
  if (USE_MOCK) return mockGetFees(params);
  try {
    return unwrap(await apiClient.get(ROUTES.fees, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const isUsingMock = () => USE_MOCK;
