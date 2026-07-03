// Multi-diocese platform — API facade (Phases 1-2).
// Mirrors the anubhavApi pattern: when REACT_APP_PLATFORM_MOCK !== 'false',
// calls hit the in-memory mock layer; otherwise the real backend via the
// shared apiClient (Bearer token attached automatically).
// Endpoint shapes: shared/API_CONTRACT_PLATFORM.md.

import apiClient from './apiClient';
import {
  mockRegisterDiocese,
  mockListDioceses,
  mockApproveDiocese,
  mockSuspendDiocese,
  mockGetOrgStructure,
  mockCreateDeanery,
  mockUpdateDeanery,
  mockDeleteDeanery,
  mockCreateParish,
  mockUpdateParish,
  mockDeleteParish,
  mockGetImportTemplate,
  mockParseImport,
  mockValidateYouthImport,
  mockCommitYouthImport,
  mockCommitOrgImport,
  mockListImportJobs,
} from './platformMock';

const USE_MOCK = process.env.REACT_APP_PLATFORM_MOCK !== 'false';

const ROUTES = {
  dioceseRegister: '/platform/dioceses/register',
  dioceses: '/platform/dioceses',
  dioceseApprove: (id) => `/platform/dioceses/${id}/approve`,
  dioceseSuspend: (id) => `/platform/dioceses/${id}/suspend`,
  orgStructure: '/org/structure',
  deaneries: '/org/deaneries',
  deaneryById: (id) => `/org/deaneries/${id}`,
  parishes: '/org/parishes',
  parishById: (id) => `/org/parishes/${id}`,
  importTemplate: '/imports/template',
  importParse: '/imports/parse',
  importYouthValidate: '/imports/youth/validate',
  importYouthCommit: '/imports/youth/commit',
  importOrgCommit: '/imports/org/commit',
  importJobs: '/imports/jobs',
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

// ---- Phase 1: dioceses -----------------------------------------------------

export const registerDiocese = async (body) => {
  if (USE_MOCK) return mockRegisterDiocese(body);
  try {
    return unwrap(await apiClient.post(ROUTES.dioceseRegister, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const listDioceses = async (params = {}) => {
  if (USE_MOCK) return mockListDioceses(params);
  try {
    return unwrap(await apiClient.get(ROUTES.dioceses, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const approveDiocese = async (id) => {
  if (USE_MOCK) return mockApproveDiocese(id);
  try {
    return unwrap(await apiClient.put(ROUTES.dioceseApprove(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const suspendDiocese = async (id) => {
  if (USE_MOCK) return mockSuspendDiocese(id);
  try {
    return unwrap(await apiClient.put(ROUTES.dioceseSuspend(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---- Phase 2: org structure -------------------------------------------------

export const getOrgStructure = async () => {
  if (USE_MOCK) return mockGetOrgStructure();
  try {
    return unwrap(await apiClient.get(ROUTES.orgStructure));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createDeanery = async (body) => {
  if (USE_MOCK) return mockCreateDeanery(body);
  try {
    return unwrap(await apiClient.post(ROUTES.deaneries, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateDeanery = async (id, body) => {
  if (USE_MOCK) return mockUpdateDeanery(id, body);
  try {
    return unwrap(await apiClient.put(ROUTES.deaneryById(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteDeanery = async (id) => {
  if (USE_MOCK) return mockDeleteDeanery(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.deaneryById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createParish = async (body) => {
  if (USE_MOCK) return mockCreateParish(body);
  try {
    return unwrap(await apiClient.post(ROUTES.parishes, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateParish = async (id, body) => {
  if (USE_MOCK) return mockUpdateParish(id, body);
  try {
    return unwrap(await apiClient.put(ROUTES.parishById(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteParish = async (id) => {
  if (USE_MOCK) return mockDeleteParish(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.parishById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---- Phase 2: import wizard --------------------------------------------------

export const getImportTemplate = async (type) => {
  if (USE_MOCK) return mockGetImportTemplate(type);
  try {
    return unwrap(await apiClient.get(ROUTES.importTemplate, { params: { type } }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const parseImport = async (body) => {
  if (USE_MOCK) return mockParseImport(body);
  try {
    return unwrap(await apiClient.post(ROUTES.importParse, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const validateYouthImport = async (body) => {
  if (USE_MOCK) return mockValidateYouthImport(body);
  try {
    return unwrap(await apiClient.post(ROUTES.importYouthValidate, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const commitYouthImport = async (body) => {
  if (USE_MOCK) return mockCommitYouthImport(body);
  try {
    return unwrap(await apiClient.post(ROUTES.importYouthCommit, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const commitOrgImport = async (body) => {
  if (USE_MOCK) return mockCommitOrgImport(body);
  try {
    return unwrap(await apiClient.post(ROUTES.importOrgCommit, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const listImportJobs = async () => {
  if (USE_MOCK) return mockListImportJobs();
  try {
    return unwrap(await apiClient.get(ROUTES.importJobs));
  } catch (error) {
    return errorEnvelope(error);
  }
};
