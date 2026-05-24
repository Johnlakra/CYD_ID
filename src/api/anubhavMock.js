// Anubhav 2026 — in-memory mock layer for Phase 1.
// All functions return the standard envelope: { success, message, data }.
// Switch the developer role for local testing by editing the seed for
// `currentUser` below — change to event_role: 'loc' and loc_place: 'phagwara'
// to preview the LOC experience.

import {
  PLACES,
  DEANERY_TO_PLACE,
  FEE_PER_YOUTH,
  deaneriesForPlace,
} from '../utils/anubhavHelpers';

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms || 50 + Math.random() * 100));

const ok = (data, message) => ({
  success: true,
  message: message || 'OK',
  data,
});

const fail = (message) => ({
  success: false,
  message: message || 'Error',
  data: null,
});

// Pick one parish per deanery so we have synthetic but believable seed data.
// Strings match the existing fallbackDeaneries map in ManageProfiles.jsx.
const SEED_PARISH_BY_DEANERY = {
  Hoshiarpur: 'Hoshiarpur',
  Tanda: 'Tanda',
  'Jalandhar Cantt.': 'Jalandhar Cantt',
  'Jalandhar City': 'Jalandhar City',
  Kapurthala: 'Kapurthala',
  Sahnewal: 'Sahnewal',
  Ludhiana: 'BRS Nagar',
  Moga: 'Moga',
  Muktsar: 'Muktsar',
  Ferozpur: 'Ferozpur City',
  'Tarn Taran': 'Tarn Taran',
  Amritsar: 'Amritsar Cantt.',
  Ajnala: 'Ajnala',
  'Fatehgarh Churian': 'Fatehgarh Churian',
  Dhariwal: 'Batala',
  Gurdaspur: 'Gurdaspur',
};

const FIRST_NAMES = [
  'Aaron', 'Beatrice', 'Caleb', 'Diana', 'Ethan', 'Fiona', 'Gabriel',
  'Hannah', 'Isaac', 'Joanna', 'Kevin', 'Lucia', 'Mark', 'Nora',
  'Oliver', 'Priya', 'Quentin', 'Rita', 'Samuel', 'Teresa',
];
const LAST_NAMES = [
  'Masih', 'Daniel', 'Joseph', 'Peter', 'Paul', 'Lall', 'Sandhu',
  'Singh', 'Massey', 'Thomas', 'John', 'Rai',
];

let nextProfileId = 1;
let nextRegistrationId = 1;
let nextChaperoneId = 1;

const buildSeedEligibleProfiles = () => {
  const profiles = [];
  Object.entries(DEANERY_TO_PLACE).forEach(([deanery]) => {
    const parish = SEED_PARISH_BY_DEANERY[deanery];
    // 6 youth per deanery so the soft-cap edge case is exercisable.
    for (let i = 0; i < 6; i += 1) {
      const first = FIRST_NAMES[(nextProfileId * 3) % FIRST_NAMES.length];
      const last = LAST_NAMES[(nextProfileId * 5) % LAST_NAMES.length];
      profiles.push({
        id: nextProfileId,
        name: `${first} ${last}`,
        parish,
        deanery,
        phone: `98${String(700000000 + nextProfileId).slice(-9)}`,
        dob: '2008-04-15',
      });
      nextProfileId += 1;
    }
  });
  return profiles;
};

const buildSeedChaperones = () => {
  const chaperones = [];
  PLACES.forEach((place) => {
    const deanery = deaneriesForPlace(place)[0];
    if (!deanery) return;
    const parish = SEED_PARISH_BY_DEANERY[deanery];
    chaperones.push({
      id: nextChaperoneId,
      place,
      parish,
      name: `Sr. Mary ${place.charAt(0).toUpperCase()}${place.slice(1)}`,
      phone: '9876500000',
      type: 'Sister',
    });
    nextChaperoneId += 1;
    chaperones.push({
      id: nextChaperoneId,
      place,
      parish,
      name: `Catechist Joseph ${place.charAt(0).toUpperCase()}${place.slice(1)}`,
      phone: '9876500111',
      type: 'Catechist',
    });
    nextChaperoneId += 1;
  });
  return chaperones;
};

const buildSeedRegistrations = (profiles, chaperones) => {
  const regs = [];
  // Register the first two youth of each deanery to give the UI real data.
  Object.keys(DEANERY_TO_PLACE).forEach((deanery) => {
    const place = DEANERY_TO_PLACE[deanery];
    const deaneryProfiles = profiles.filter((p) => p.deanery === deanery);
    const chaperone = chaperones.find(
      (c) => c.place === place && c.parish === SEED_PARISH_BY_DEANERY[deanery]
    );
    deaneryProfiles.slice(0, 2).forEach((profile) => {
      regs.push({
        id: nextRegistrationId,
        place,
        profile_id: profile.id,
        chaperone_id: chaperone ? chaperone.id : null,
        registered_at: new Date().toISOString(),
      });
      nextRegistrationId += 1;
    });
  });
  return regs;
};

const seedProfiles = buildSeedEligibleProfiles();
const seedChaperones = buildSeedChaperones();
const seedRegistrations = buildSeedRegistrations(seedProfiles, seedChaperones);

// Module-level mutable store. Mock-only — never used in production paths.
let store = {
  currentUser: {
    // Default role for local dev. Flip to { event_role: 'loc', loc_place: 'phagwara' }
    // to preview the LOC-restricted experience.
    event_role: 'dexco',
    loc_place: null,
  },
  eligibleProfiles: seedProfiles,
  chaperones: seedChaperones,
  registrations: seedRegistrations,
};

const matchesSearch = (profile, search) => {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    profile.name.toLowerCase().includes(needle) ||
    profile.phone.includes(needle)
  );
};

const filterProfiles = ({ place, deanery, parish, search }) => {
  return store.eligibleProfiles.filter((p) => {
    if (place && DEANERY_TO_PLACE[p.deanery] !== place) return false;
    if (deanery && p.deanery !== deanery) return false;
    if (parish && p.parish !== parish) return false;
    if (!matchesSearch(p, search)) return false;
    return true;
  });
};

export const mockGetMyRole = async () => {
  await delay();
  return ok(store.currentUser, 'Role fetched');
};

export const mockGetEligible = async (params) => {
  await delay();
  const registeredIds = new Set(store.registrations.map((r) => r.profile_id));
  const available = filterProfiles(params || {}).filter(
    (p) => !registeredIds.has(p.id)
  );
  return ok(available, 'Eligible profiles');
};

const enrichRegistration = (registration) => {
  const profile = store.eligibleProfiles.find(
    (p) => p.id === registration.profile_id
  );
  const chaperone = store.chaperones.find(
    (c) => c.id === registration.chaperone_id
  );
  return {
    id: registration.id,
    place: registration.place,
    profile_id: registration.profile_id,
    chaperone_id: registration.chaperone_id,
    registered_at: registration.registered_at,
    name: profile ? profile.name : 'Unknown',
    parish: profile ? profile.parish : '-',
    deanery: profile ? profile.deanery : '-',
    phone: profile ? profile.phone : '-',
    chaperone_name: chaperone ? chaperone.name : null,
    chaperone_phone: chaperone ? chaperone.phone : null,
    chaperone_type: chaperone ? chaperone.type : null,
    fee: FEE_PER_YOUTH,
  };
};

export const mockGetRegistrations = async (params) => {
  await delay();
  const { place, deanery, parish } = params || {};
  const filtered = store.registrations.filter((r) => {
    if (place && r.place !== place) return false;
    const profile = store.eligibleProfiles.find((p) => p.id === r.profile_id);
    if (!profile) return false;
    if (deanery && profile.deanery !== deanery) return false;
    if (parish && profile.parish !== parish) return false;
    return true;
  });
  const enriched = filtered.map(enrichRegistration);
  const counts = enriched.reduce((acc, reg) => {
    const key = reg.parish;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return ok(
    {
      registrations: enriched,
      countsByParish: counts,
      total: enriched.length,
    },
    'Registrations fetched'
  );
};

export const mockCreateRegistration = async (body) => {
  await delay();
  const { place, profile_id, chaperone_id } = body || {};
  if (!place || !profile_id) {
    return fail('place and profile_id are required');
  }
  const alreadyRegistered = store.registrations.some(
    (r) => r.profile_id === profile_id
  );
  if (alreadyRegistered) {
    return fail('Profile already registered');
  }
  const newReg = {
    id: nextRegistrationId,
    place,
    profile_id,
    chaperone_id: chaperone_id || null,
    registered_at: new Date().toISOString(),
  };
  nextRegistrationId += 1;
  store = {
    ...store,
    registrations: [...store.registrations, newReg],
  };
  return ok(enrichRegistration(newReg), 'Registered');
};

export const mockDeleteRegistration = async (id) => {
  await delay();
  const target = store.registrations.find((r) => r.id === Number(id));
  if (!target) {
    return fail('Registration not found');
  }
  store = {
    ...store,
    registrations: store.registrations.filter((r) => r.id !== Number(id)),
  };
  return ok({ id: Number(id) }, 'Un-registered');
};

export const mockGetChaperones = async (params) => {
  await delay();
  const { place, parish } = params || {};
  const filtered = store.chaperones.filter((c) => {
    if (place && c.place !== place) return false;
    if (parish && c.parish !== parish) return false;
    return true;
  });
  return ok(filtered, 'Chaperones fetched');
};

export const mockCreateChaperone = async (body) => {
  await delay();
  const { place, parish, name, phone, type } = body || {};
  if (!place || !parish || !name || !phone || !type) {
    return fail('All fields are required');
  }
  if (type !== 'Sister' && type !== 'Catechist') {
    return fail('type must be Sister or Catechist');
  }
  const created = {
    id: nextChaperoneId,
    place,
    parish,
    name,
    phone,
    type,
  };
  nextChaperoneId += 1;
  store = {
    ...store,
    chaperones: [...store.chaperones, created],
  };
  return ok(created, 'Chaperone added');
};

export const mockGetFees = async (params) => {
  await delay();
  const { place } = params || {};
  const scoped = place
    ? store.registrations.filter((r) => r.place === place)
    : store.registrations;
  const byParishMap = {};
  const byDeaneryMap = {};
  scoped.forEach((reg) => {
    const profile = store.eligibleProfiles.find(
      (p) => p.id === reg.profile_id
    );
    if (!profile) return;
    const parishKey = `${profile.deanery}::${profile.parish}`;
    if (!byParishMap[parishKey]) {
      byParishMap[parishKey] = {
        deanery: profile.deanery,
        parish: profile.parish,
        count: 0,
        total: 0,
      };
    }
    byParishMap[parishKey].count += 1;
    byParishMap[parishKey].total += FEE_PER_YOUTH;

    if (!byDeaneryMap[profile.deanery]) {
      byDeaneryMap[profile.deanery] = {
        deanery: profile.deanery,
        count: 0,
        total: 0,
      };
    }
    byDeaneryMap[profile.deanery].count += 1;
    byDeaneryMap[profile.deanery].total += FEE_PER_YOUTH;
  });

  const byParish = Object.values(byParishMap).sort((a, b) => {
    if (a.deanery === b.deanery) return a.parish.localeCompare(b.parish);
    return a.deanery.localeCompare(b.deanery);
  });
  const byDeanery = Object.values(byDeaneryMap).sort((a, b) =>
    a.deanery.localeCompare(b.deanery)
  );
  const placeTotal = scoped.length * FEE_PER_YOUTH;
  const overall = store.registrations.length * FEE_PER_YOUTH;

  return ok(
    {
      perYouth: FEE_PER_YOUTH,
      byParish,
      byDeanery,
      placeTotal,
      overall,
      placeCount: scoped.length,
      overallCount: store.registrations.length,
    },
    'Fees calculated'
  );
};

// ---------------------------------------------------------------------------
// Phase 2 — Accommodation seed data
// ---------------------------------------------------------------------------

const seedBuildings = [
  { id: 1, place: 'phagwara',  name: 'Stella Maris Hall' },
  { id: 2, place: 'phagwara',  name: "St. Joseph's Block" },
  { id: 3, place: 'abohar',   name: 'Don Bosco Block' },
  { id: 4, place: 'abohar',   name: 'Holy Cross Block' },
  { id: 5, place: 'amritsar', name: 'Assisi Hall' },
  { id: 6, place: 'amritsar', name: 'Providence Block' },
];

// 2 floors per building (level 0 = Ground Floor, level 1 = First Floor)
// Building IDs 1-6, each gets 2 floors → floor IDs 1-12
const seedFloors = (() => {
  const floors = [];
  let id = 1;
  seedBuildings.forEach((b) => {
    floors.push({ id, building_id: b.id, level: 0, name: 'Ground Floor' });
    id += 1;
    floors.push({ id, building_id: b.id, level: 1, name: 'First Floor' });
    id += 1;
  });
  return floors;
})();

// 3 rooms per floor (capacity 6), named Room A / B / C → room IDs 1-36
const ROOM_NAMES = ['Room A', 'Room B', 'Room C'];
const seedRooms = (() => {
  const rooms = [];
  let id = 1;
  seedFloors.forEach((f) => {
    ROOM_NAMES.forEach((name) => {
      rooms.push({ id, floor_id: f.id, name, capacity: 6 });
      id += 1;
    });
  });
  return rooms;
})();

// Helper: find room by building+floor_level+room_name
const findSeedRoom = (buildingId, level, roomName) => {
  const floor = seedFloors.find(
    (f) => f.building_id === buildingId && f.level === level
  );
  if (!floor) return null;
  return seedRooms.find((r) => r.floor_id === floor.id && r.name === roomName);
};

// Pre-allot seed data as specified in the plan
const seedAllotments = (() => {
  const allotments = [];
  let id = 1;

  const specs = [
    { buildingId: 1, level: 0, roomName: 'Room A', regIds: [1, 2] },
    { buildingId: 1, level: 0, roomName: 'Room B', regIds: [3, 4] },
    { buildingId: 3, level: 0, roomName: 'Room A', regIds: [15, 16] },
    { buildingId: 5, level: 0, roomName: 'Room A', regIds: [21, 22] },
  ];

  specs.forEach(({ buildingId, level, roomName, regIds }) => {
    const room = findSeedRoom(buildingId, level, roomName);
    if (!room) return;
    regIds.forEach((regId) => {
      allotments.push({ id, room_id: room.id, registration_id: regId });
      id += 1;
    });
  });

  return allotments;
})();

// Extend store with Phase 2 data
store = {
  ...store,
  buildings: seedBuildings,
  floors: seedFloors,
  rooms: seedRooms,
  allotments: seedAllotments,
};

let nextBuildingId  = 7;  // 6 seeded
let nextFloorId     = 13; // 12 seeded
let nextRoomId      = 37; // 36 seeded
let nextAllotmentId = 5;  // 4 seeded

// ---------------------------------------------------------------------------
// Phase 2 — Mock helper: enrich occupants for a room
// ---------------------------------------------------------------------------

const enrichOccupants = (roomId) => {
  return store.allotments
    .filter((a) => a.room_id === roomId)
    .map((a) => {
      const reg = store.registrations.find((r) => r.id === a.registration_id);
      const profile = reg
        ? store.eligibleProfiles.find((p) => p.id === reg.profile_id)
        : null;
      return {
        allotment_id: a.id,
        registration_id: a.registration_id,
        name: profile ? profile.name : 'Unknown',
        parish: profile ? profile.parish : '-',
        deanery: profile ? profile.deanery : '-',
        phone: profile ? profile.phone : '-',
      };
    });
};

// Build the full nested structure for a set of buildings
const buildNestedStructure = (buildings) => {
  return buildings.map((building) => {
    const floors = store.floors
      .filter((f) => f.building_id === building.id)
      .sort((a, b) => a.level - b.level)
      .map((floor) => {
        const rooms = store.rooms
          .filter((r) => r.floor_id === floor.id)
          .map((room) => {
            const occupants = enrichOccupants(room.id);
            return {
              id: room.id,
              floor_id: room.floor_id,
              name: room.name,
              capacity: room.capacity,
              occupancy: occupants.length,
              occupants,
            };
          });
        const floorCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
        const floorOccupancy = rooms.reduce((s, r) => s + r.occupancy, 0);
        return {
          id: floor.id,
          building_id: floor.building_id,
          level: floor.level,
          name: floor.name,
          capacity: floorCapacity,
          occupancy: floorOccupancy,
          rooms,
        };
      });
    const totalCapacity = floors.reduce((s, f) => s + f.capacity, 0);
    const totalOccupancy = floors.reduce((s, f) => s + f.occupancy, 0);
    return {
      id: building.id,
      place: building.place,
      name: building.name,
      capacity: totalCapacity,
      occupancy: totalOccupancy,
      floors,
    };
  });
};

// ---------------------------------------------------------------------------
// Phase 2 — Exported mock functions
// ---------------------------------------------------------------------------

export const mockGetBuildings = async (params) => {
  await delay();
  const { place } = params || {};
  const filtered = place
    ? store.buildings.filter((b) => b.place === place)
    : store.buildings;
  return ok(buildNestedStructure(filtered), 'Buildings fetched');
};

export const mockCreateBuilding = async (body) => {
  await delay();
  const { place, name } = body || {};
  if (!place || !name || !name.trim()) {
    return fail('place and name are required');
  }
  const created = { id: nextBuildingId, place, name: name.trim() };
  nextBuildingId += 1;
  store = { ...store, buildings: [...store.buildings, created] };
  return ok(created, 'Building created');
};

export const mockCreateFloor = async (body) => {
  await delay();
  const { building_id, name, level } = body || {};
  if (!building_id || !name || !name.trim() || level === undefined || level === null) {
    return fail('building_id, name, and level are required');
  }
  const buildingExists = store.buildings.some((b) => b.id === Number(building_id));
  if (!buildingExists) {
    return fail('Building not found');
  }
  const created = {
    id: nextFloorId,
    building_id: Number(building_id),
    level: Number(level),
    name: name.trim(),
  };
  nextFloorId += 1;
  store = { ...store, floors: [...store.floors, created] };
  return ok(created, 'Floor created');
};

export const mockCreateRoom = async (body) => {
  await delay();
  const { floor_id, name, capacity } = body || {};
  if (!floor_id || !name || !name.trim()) {
    return fail('floor_id and name are required');
  }
  const floorExists = store.floors.some((f) => f.id === Number(floor_id));
  if (!floorExists) {
    return fail('Floor not found');
  }
  const created = {
    id: nextRoomId,
    floor_id: Number(floor_id),
    name: name.trim(),
    capacity: Number(capacity) || 6,
  };
  nextRoomId += 1;
  store = { ...store, rooms: [...store.rooms, created] };
  return ok(created, 'Room created');
};

export const mockCreateAllotment = async (body) => {
  await delay();
  const { room_id, registration_id } = body || {};
  if (!room_id || !registration_id) {
    return fail('room_id and registration_id are required');
  }
  const room = store.rooms.find((r) => r.id === Number(room_id));
  if (!room) {
    return fail('Room not found');
  }
  const registration = store.registrations.find(
    (r) => r.id === Number(registration_id)
  );
  if (!registration) {
    return fail('Registration not found');
  }

  // Check not already allotted in any room for this place
  const floor = store.floors.find((f) => f.id === room.floor_id);
  const building = floor ? store.buildings.find((b) => b.id === floor.building_id) : null;
  const place = building ? building.place : null;

  if (place) {
    const placeRoomIds = new Set(
      store.rooms
        .filter((r) => {
          const f = store.floors.find((fl) => fl.id === r.floor_id);
          const b = f ? store.buildings.find((bl) => bl.id === f.building_id) : null;
          return b && b.place === place;
        })
        .map((r) => r.id)
    );
    const alreadyAllotted = store.allotments.some(
      (a) =>
        a.registration_id === Number(registration_id) &&
        placeRoomIds.has(a.room_id)
    );
    if (alreadyAllotted) {
      return fail('Youth is already allotted to a room at this venue');
    }
  }

  // Check room capacity
  const currentOccupancy = store.allotments.filter(
    (a) => a.room_id === Number(room_id)
  ).length;
  if (currentOccupancy >= room.capacity) {
    return fail('Room is at full capacity');
  }

  const created = {
    id: nextAllotmentId,
    room_id: Number(room_id),
    registration_id: Number(registration_id),
  };
  nextAllotmentId += 1;
  store = { ...store, allotments: [...store.allotments, created] };
  return ok(created, 'Allotment created');
};

export const mockDeleteAllotment = async (id) => {
  await delay();
  const target = store.allotments.find((a) => a.id === Number(id));
  if (!target) {
    return fail('Allotment not found');
  }
  store = {
    ...store,
    allotments: store.allotments.filter((a) => a.id !== Number(id)),
  };
  return ok({ id: Number(id) }, 'Allotment removed');
};

export const mockGetRooming = async (params) => {
  await delay();
  const { place, building_id, floor_id, room_id } = params || {};
  let buildings = place
    ? store.buildings.filter((b) => b.place === place)
    : store.buildings;

  if (building_id) {
    buildings = buildings.filter((b) => b.id === Number(building_id));
  }

  const nested = buildNestedStructure(buildings).map((b) => ({
    ...b,
    floors: b.floors
      .filter((f) => !floor_id || f.id === Number(floor_id))
      .map((f) => ({
        ...f,
        rooms: f.rooms.filter((r) => !room_id || r.id === Number(room_id)),
      })),
  }));

  return ok(nested, 'Rooming data fetched');
};
