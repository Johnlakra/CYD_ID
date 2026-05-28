// Anubhav 2026 — API facade for Phase 1.
// When REACT_APP_ANUBHAV_MOCK !== 'false', all calls hit the in-memory mock
// layer. Otherwise they hit the real backend via the shared apiClient (which
// already attaches the Bearer token).

import apiClient from './apiClient';
import {
  mockGetMyRole,
  mockGetEligible,
  mockGetDeaneryParishMap,
  mockGetRegistrations,
  mockCreateRegistration,
  mockDeleteRegistration,
  mockGetChaperones,
  mockCreateChaperone,
  mockGetFees,
  mockGetBuildings,
  mockCreateBuilding,
  mockCreateFloor,
  mockCreateRoom,
  mockCreateAllotment,
  mockCreateAllotmentBatch,
  mockDeleteAllotment,
  mockDeleteBuilding,
  mockDeleteFloor,
  mockDeleteRoom,
  mockGetRooming,
  mockGetTimetable,
  mockCreateTimetableItem,
  mockUpdateTimetableItem,
  mockDeleteTimetableItem,
  mockGetTimetableLive,
  mockGetAnnouncements,
  mockCreateAnnouncement,
  mockDeleteAnnouncement,
  mockGetMyEvent,
  mockSearchUsers,
  mockGrantRole,
  mockListRoles,
} from './anubhavMock';

const USE_MOCK = process.env.REACT_APP_ANUBHAV_MOCK !== 'false';

const ROUTES = {
  role: '/anubhav/me/role',
  myEvent: '/anubhav/my/event',
  eligible: '/anubhav/eligible',
  deaneryParishMap: '/anubhav/deanery-parish-map',
  registrations: '/anubhav/registrations',
  registrationById: (id) => `/anubhav/registrations/${id}`,
  chaperones: '/anubhav/chaperones',
  fees: '/anubhav/fees',
  buildings: '/anubhav/buildings',
  buildingById: (id) => `/anubhav/buildings/${id}`,
  floors: '/anubhav/floors',
  floorById: (id) => `/anubhav/floors/${id}`,
  rooms: '/anubhav/rooms',
  roomById: (id) => `/anubhav/rooms/${id}`,
  allotments: '/anubhav/allotments',
  allotmentsBatch: '/anubhav/allotments/batch',
  allotmentById: (id) => `/anubhav/allotments/${id}`,
  rooming: '/anubhav/rooming',
  timetable: '/anubhav/timetable',
  timetableById: (id) => `/anubhav/timetable/${id}`,
  timetableLive: '/anubhav/timetable/live',
  announcements: '/anubhav/announcements',
  announcementById: (id) => `/anubhav/announcements/${id}`,
  usersSearch: '/anubhav/users/search',
  roles: '/anubhav/roles',
  rolesGrant: '/anubhav/roles/grant',
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

export const getDeaneryParishMap = async () => {
  if (USE_MOCK) return mockGetDeaneryParishMap();
  try {
    return unwrap(await apiClient.get(ROUTES.deaneryParishMap));
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

// ---------------------------------------------------------------------------
// Phase 2 — Accommodation
// ---------------------------------------------------------------------------

export const getBuildings = async (params) => {
  if (USE_MOCK) return mockGetBuildings(params);
  try {
    return unwrap(await apiClient.get(ROUTES.buildings, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createBuilding = async (body) => {
  if (USE_MOCK) return mockCreateBuilding(body);
  try {
    return unwrap(await apiClient.post(ROUTES.buildings, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createFloor = async (body) => {
  if (USE_MOCK) return mockCreateFloor(body);
  try {
    return unwrap(await apiClient.post(ROUTES.floors, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createRoom = async (body) => {
  if (USE_MOCK) return mockCreateRoom(body);
  try {
    return unwrap(await apiClient.post(ROUTES.rooms, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createAllotment = async (body) => {
  if (USE_MOCK) return mockCreateAllotment(body);
  try {
    return unwrap(await apiClient.post(ROUTES.allotments, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createAllotmentBatch = async (body) => {
  if (USE_MOCK) return mockCreateAllotmentBatch(body);
  try {
    return unwrap(await apiClient.post(ROUTES.allotmentsBatch, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteAllotment = async (id) => {
  if (USE_MOCK) return mockDeleteAllotment(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.allotmentById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteBuilding = async (id) => {
  if (USE_MOCK) return mockDeleteBuilding(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.buildingById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteFloor = async (id) => {
  if (USE_MOCK) return mockDeleteFloor(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.floorById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteRoom = async (id) => {
  if (USE_MOCK) return mockDeleteRoom(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.roomById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getRooming = async (params) => {
  if (USE_MOCK) return mockGetRooming(params);
  try {
    return unwrap(await apiClient.get(ROUTES.rooming, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---------------------------------------------------------------------------
// Phase 3 — Timetable
// ---------------------------------------------------------------------------

export const getTimetable = async (params) => {
  if (USE_MOCK) return mockGetTimetable(params);
  try {
    return unwrap(await apiClient.get(ROUTES.timetable, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createTimetableItem = async (body) => {
  if (USE_MOCK) return mockCreateTimetableItem(body);
  try {
    return unwrap(await apiClient.post(ROUTES.timetable, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const updateTimetableItem = async (id, body) => {
  if (USE_MOCK) return mockUpdateTimetableItem(id, body);
  try {
    return unwrap(await apiClient.put(ROUTES.timetableById(id), body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteTimetableItem = async (id) => {
  if (USE_MOCK) return mockDeleteTimetableItem(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.timetableById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const getTimetableLive = async (params) => {
  if (USE_MOCK) return mockGetTimetableLive(params);
  try {
    return unwrap(await apiClient.get(ROUTES.timetableLive, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---------------------------------------------------------------------------
// Phase 3 — Announcements
// ---------------------------------------------------------------------------

export const getAnnouncements = async (params) => {
  if (USE_MOCK) return mockGetAnnouncements(params);
  try {
    return unwrap(await apiClient.get(ROUTES.announcements, { params }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const createAnnouncement = async (body) => {
  if (USE_MOCK) return mockCreateAnnouncement(body);
  try {
    return unwrap(await apiClient.post(ROUTES.announcements, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const deleteAnnouncement = async (id) => {
  if (USE_MOCK) return mockDeleteAnnouncement(id);
  try {
    return unwrap(await apiClient.delete(ROUTES.announcementById(id)));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---------------------------------------------------------------------------
// Participant self-view
// ---------------------------------------------------------------------------

export const getMyEvent = async () => {
  if (USE_MOCK) return mockGetMyEvent();
  try {
    return unwrap(await apiClient.get(ROUTES.myEvent));
  } catch (error) {
    return errorEnvelope(error);
  }
};

// ---------------------------------------------------------------------------
// Role management (admin)
// ---------------------------------------------------------------------------

export const searchUsers = async (q) => {
  if (USE_MOCK) return mockSearchUsers(q);
  try {
    return unwrap(await apiClient.get(ROUTES.usersSearch, { params: { q } }));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const grantRole = async (body) => {
  if (USE_MOCK) return mockGrantRole(body);
  try {
    return unwrap(await apiClient.post(ROUTES.rolesGrant, body));
  } catch (error) {
    return errorEnvelope(error);
  }
};

export const listRoles = async () => {
  if (USE_MOCK) return mockListRoles();
  try {
    return unwrap(await apiClient.get(ROUTES.roles));
  } catch (error) {
    return errorEnvelope(error);
  }
};
