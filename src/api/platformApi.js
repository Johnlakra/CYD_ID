// Multi-diocese platform — API facade (Phases 1-2).
// Mirrors the anubhavApi pattern: when REACT_APP_PLATFORM_MOCK !== 'false',
// calls hit the in-memory mock layer; otherwise the real backend via the
// shared apiClient (Bearer token attached automatically).
// Endpoint shapes: shared/API_CONTRACT_PLATFORM.md.

import apiClient from './apiClient';
import {
  mockGetMyPermissions,
  mockGetPermissionCatalog,
  mockGetPermissionMatrix,
  mockListRoles,
  mockCreateRole,
  mockSetRolePermissions,
  mockDuplicateRole,
  mockDeleteRole,
  mockGetUserAccess,
  mockAssignUserRole,
  mockRemoveUserRole,
  mockSetUserOverride,
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
import {
  mockArchiveEvent,
  mockCreateEvent,
  mockCreateEventVenue,
  mockDeleteEventVenue,
  mockGetEvent,
  mockGetEventStats,
  mockListEventVenues,
  mockListEvents,
  mockUpdateEvent,
  mockUpdateEventVenue,
} from './platformMockEvents';
import {
  mockListIdCardTemplates,
  mockGetIdCardGallery,
  mockResolveIdCardTemplate,
  mockGetIdCardTemplate,
  mockCreateIdCardTemplate,
  mockUpdateIdCardTemplate,
  mockSetDefaultIdCardTemplate,
  mockDuplicateIdCardTemplate,
  mockDeleteIdCardTemplate,
} from './platformMockIdCards';

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
  myPermissions: '/auth/me/permissions',
  permissionCatalog: '/permissions/catalog',
  permissionMatrix: '/permissions/matrix',
  permissionRoles: '/permissions/roles',
  permissionRoleById: (id) => `/permissions/roles/${id}`,
  permissionRolePerms: (id) => `/permissions/roles/${id}/permissions`,
  permissionRoleDuplicate: (id) => `/permissions/roles/${id}/duplicate`,
  permissionUser: (userId) => `/permissions/users/${userId}`,
  permissionUserRoles: (userId) => `/permissions/users/${userId}/roles`,
  permissionUserRoleById: (userId, roleId) => `/permissions/users/${userId}/roles/${roleId}`,
  permissionUserOverrides: (userId) => `/permissions/users/${userId}/overrides`,
  idCardTemplates: '/idcard-templates',
  idCardGallery: '/idcard-templates/gallery',
  idCardResolve: '/idcard-templates/resolve',
  idCardTemplateById: (id) => `/idcard-templates/${id}`,
  idCardTemplateDefault: (id) => `/idcard-templates/${id}/default`,
  idCardTemplateDuplicate: (id) => `/idcard-templates/${id}/duplicate`,
  events: '/events',
  eventById: (id) => `/events/${id}`,
  eventVenues: (id) => `/events/${id}/venues`,
  eventVenueById: (id, venueId) => `/events/${id}/venues/${venueId}`,
  eventStats: (id) => `/events/${id}/stats`,
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

// ---- Phase 3: permission engine ----------------------------------------------

export const getMyPermissions = async () => {
  if (USE_MOCK) return mockGetMyPermissions();
  try {
    return unwrap(await apiClient.get(ROUTES.myPermissions));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getPermissionCatalog = async () => {
  if (USE_MOCK) return mockGetPermissionCatalog();
  try {
    return unwrap(await apiClient.get(ROUTES.permissionCatalog));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getPermissionMatrix = async () => {
  if (USE_MOCK) return mockGetPermissionMatrix();
  try {
    return unwrap(await apiClient.get(ROUTES.permissionMatrix));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const listRoles = async () => {
  if (USE_MOCK) return mockListRoles();
  try {
    return unwrap(await apiClient.get(ROUTES.permissionRoles));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createRole = async (body) => {
  if (USE_MOCK) return mockCreateRole(body);
  try {
    return unwrap(await apiClient.post(ROUTES.permissionRoles, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const setRolePermissions = async (roleId, permKeys) => {
  if (USE_MOCK) return mockSetRolePermissions(roleId, permKeys);
  try {
    return unwrap(
      await apiClient.put(ROUTES.permissionRolePerms(roleId), { perm_keys: permKeys })
    );
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const duplicateRole = async (roleId, body) => {
  if (USE_MOCK) return mockDuplicateRole(roleId, body);
  try {
    return unwrap(await apiClient.post(ROUTES.permissionRoleDuplicate(roleId), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteRole = async (roleId) => {
  if (USE_MOCK) return mockDeleteRole(roleId);
  try {
    return unwrap(await apiClient.delete(ROUTES.permissionRoleById(roleId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getUserAccess = async (userId) => {
  if (USE_MOCK) return mockGetUserAccess(userId);
  try {
    return unwrap(await apiClient.get(ROUTES.permissionUser(userId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const assignUserRole = async (userId, body) => {
  if (USE_MOCK) return mockAssignUserRole(userId, body);
  try {
    return unwrap(await apiClient.post(ROUTES.permissionUserRoles(userId), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const removeUserRole = async (userId, roleId) => {
  if (USE_MOCK) return mockRemoveUserRole(userId, roleId);
  try {
    return unwrap(await apiClient.delete(ROUTES.permissionUserRoleById(userId, roleId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const setUserOverride = async (userId, body) => {
  if (USE_MOCK) return mockSetUserOverride(userId, body);
  try {
    return unwrap(await apiClient.put(ROUTES.permissionUserOverrides(userId), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---- Phase 4: ID card template designer ----------------------------------------

export const listIdCardTemplates = async () => {
  if (USE_MOCK) return mockListIdCardTemplates();
  try {
    return unwrap(await apiClient.get(ROUTES.idCardTemplates));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getIdCardGallery = async () => {
  if (USE_MOCK) return mockGetIdCardGallery();
  try {
    return unwrap(await apiClient.get(ROUTES.idCardGallery));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const resolveIdCardTemplate = async (level) => {
  if (USE_MOCK) return mockResolveIdCardTemplate(level);
  try {
    return unwrap(await apiClient.get(ROUTES.idCardResolve, { params: { level } }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getIdCardTemplate = async (id) => {
  if (USE_MOCK) return mockGetIdCardTemplate(id);
  try {
    return unwrap(await apiClient.get(ROUTES.idCardTemplateById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createIdCardTemplate = async (body) => {
  if (USE_MOCK) return mockCreateIdCardTemplate(body);
  try {
    return unwrap(await apiClient.post(ROUTES.idCardTemplates, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateIdCardTemplate = async (id, body) => {
  if (USE_MOCK) return mockUpdateIdCardTemplate(id, body);
  try {
    return unwrap(await apiClient.put(ROUTES.idCardTemplateById(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const setDefaultIdCardTemplate = async (id) => {
  if (USE_MOCK) return mockSetDefaultIdCardTemplate(id);
  try {
    return unwrap(await apiClient.put(ROUTES.idCardTemplateDefault(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const duplicateIdCardTemplate = async (id, body = {}) => {
  if (USE_MOCK) return mockDuplicateIdCardTemplate(id, body);
  try {
    return unwrap(await apiClient.post(ROUTES.idCardTemplateDuplicate(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteIdCardTemplate = async (id) => {
  if (USE_MOCK) return mockDeleteIdCardTemplate(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.idCardTemplateById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---- Phase 5: generalized events engine -----------------------------------------

export const listEvents = async () => {
  if (USE_MOCK) return mockListEvents();
  try {
    return unwrap(await apiClient.get(ROUTES.events));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createEvent = async (body) => {
  if (USE_MOCK) return mockCreateEvent(body);
  try {
    return unwrap(await apiClient.post(ROUTES.events, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getEvent = async (id) => {
  if (USE_MOCK) return mockGetEvent(id);
  try {
    return unwrap(await apiClient.get(ROUTES.eventById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateEvent = async (id, body) => {
  if (USE_MOCK) return mockUpdateEvent(id, body);
  try {
    return unwrap(await apiClient.put(ROUTES.eventById(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// DELETE /events/:id is a soft archive on the backend (status='archived').
export const archiveEvent = async (id) => {
  if (USE_MOCK) return mockArchiveEvent(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.eventById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const listEventVenues = async (eventId) => {
  if (USE_MOCK) return mockListEventVenues(eventId);
  try {
    return unwrap(await apiClient.get(ROUTES.eventVenues(eventId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createEventVenue = async (eventId, body) => {
  if (USE_MOCK) return mockCreateEventVenue(eventId, body);
  try {
    return unwrap(await apiClient.post(ROUTES.eventVenues(eventId), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateEventVenue = async (eventId, venueId, body) => {
  if (USE_MOCK) return mockUpdateEventVenue(eventId, venueId, body);
  try {
    return unwrap(await apiClient.put(ROUTES.eventVenueById(eventId, venueId), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteEventVenue = async (eventId, venueId) => {
  if (USE_MOCK) return mockDeleteEventVenue(eventId, venueId);
  try {
    return unwrap(await apiClient.delete(ROUTES.eventVenueById(eventId, venueId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getEventStats = async (eventId) => {
  if (USE_MOCK) return mockGetEventStats(eventId);
  try {
    return unwrap(await apiClient.get(ROUTES.eventStats(eventId)));
  } catch (error) {
    return errorEnvelope(error);
  }
};
