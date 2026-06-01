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
  missingIdCardFields,
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
        father_name: `${FIRST_NAMES[(nextProfileId * 7) % FIRST_NAMES.length]} ${LAST_NAMES[(nextProfileId * 11) % LAST_NAMES.length]}`,
        photo_url: null,
        is_independent: 0,
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

// Option B independent entries — youth registered directly for Anubhav without
// an existing ID-card profile. Stored as profile rows with is_independent=1.
// Seeded with a deliberate mix: one fully complete (promotable/printable), and
// two incomplete (exercise the missing-fields tooltip + promote-gating paths).
const buildSeedIndependents = () => {
  const list = [
    {
      // COMPLETE — every ID-card-required field present.
      name: 'Independent Asha',
      parish: 'Hoshiarpur',
      deanery: 'Hoshiarpur',
      dob: '2008-07-21',
      father_name: 'Joseph Masih',
      photo_url: 'https://placehold.co/200x200',
      level: 'parish',
      designation: 'Member',
      postal_address: '12 Church Road, Hoshiarpur',
    },
    {
      // INCOMPLETE — missing father_name, dob, postal_address, level, designation, photo.
      name: 'Independent Rahul',
      parish: 'Moga',
      deanery: 'Moga',
      dob: null,
      father_name: null,
      photo_url: null,
      level: null,
      designation: null,
      postal_address: null,
    },
    {
      // PARTIAL — only the photo is missing.
      name: 'Independent Neha',
      parish: 'Amritsar Cantt.',
      deanery: 'Amritsar',
      dob: '2009-02-10',
      father_name: 'Peter Singh',
      photo_url: null,
      level: 'deanery',
      designation: 'Volunteer',
      postal_address: '5 Mall Road, Amritsar',
    },
  ];
  return list.map((seed) => {
    const row = {
      id: nextProfileId,
      phone: `97${String(800000000 + nextProfileId).slice(-9)}`,
      is_independent: 1,
      ...seed,
    };
    nextProfileId += 1;
    return row;
  });
};

const seedProfiles = [...buildSeedEligibleProfiles(), ...buildSeedIndependents()];
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
    String(profile.phone || '').includes(needle)
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

// Diocese-wide deanery→parishes map (mirrors DB deanery/parish tables).
const MOCK_DEANERY_PARISH_MAP = {
  'Hoshiarpur':        ['Hoshiarpur', 'Garhshankar', 'Mukerian'],
  'Tanda':             ['Tanda', 'Una'],
  'Jalandhar Cantt.':  ['Jalandhar Cantt', 'Nakodar'],
  'Jalandhar City':    ['Jalandhar City', 'Phagwara'],
  'Kapurthala':        ['Kapurthala', 'Sultanpur Lodhi'],
  'Sahnewal':          ['Sahnewal', 'Doraha'],
  'Ludhiana':          ['BRS Nagar', 'Ludhiana City', 'Noorpur Bedi'],
  'Moga':              ['Moga', 'Baghapurana'],
  'Muktsar':           ['Muktsar', 'Gidderbaha'],
  'Ferozpur':          ['Ferozpur City', 'Zira', 'Abohar'],
  'Tarn Taran':        ['Tarn Taran', 'Patti'],
  'Amritsar':          ['Amritsar Cantt.', 'Amritsar City'],
  'Ajnala':            ['Ajnala', 'Rajasansi'],
  'Fatehgarh Churian': ['Fatehgarh Churian', 'Dera Baba Nanak'],
  'Dhariwal':          ['Batala', 'Qadian'],
  'Gurdaspur':         ['Gurdaspur', 'Dinanagar'],
};

export const mockGetDeaneryParishMap = async () => {
  await delay();
  return ok(MOCK_DEANERY_PARISH_MAP, 'Deanery-parish map');
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
    registration_id: registration.id,
    place: registration.place,
    profile_id: registration.profile_id,
    chaperone_id: registration.chaperone_id,
    created_at: registration.registered_at,
    name: profile ? profile.name : 'Unknown',
    parish: profile ? profile.parish : '-',
    deanery: profile ? profile.deanery : '-',
    phone: profile ? profile.phone : '-',
    father_name: profile ? profile.father_name : null,
    photo_url: profile ? profile.photo_url || null : null,
    is_independent: profile ? profile.is_independent || 0 : 0,
    chaperone_name: chaperone ? chaperone.name : null,
    chaperone_phone: chaperone ? chaperone.phone : null,
    chaperone_type: chaperone ? chaperone.type : null,
    fee_amount: FEE_PER_YOUTH,
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
  // Return shape matches real backend: { chaperones: [...], count: N }
  // RegisterYouth.jsx reads response.data?.chaperones — plain-array data would return
  // undefined there, causing a silent safeArray([]) empty-chaperone bug (BUG-001).
  return ok({ chaperones: filtered, count: filtered.length }, 'Chaperones fetched');
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
        father_name: profile ? profile.father_name : null,
        photo_url: profile ? profile.photo_url || null : null,
        is_independent: profile ? profile.is_independent || 0 : 0,
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
  // Return shape matches real backend: { place, buildings: [...nested...] }
  return ok({ place: place || null, buildings: buildNestedStructure(filtered) }, 'Buildings fetched');
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

export const mockCreateAllotmentBatch = async (body) => {
  await delay();
  const { room_id, registration_ids } = body || {};
  if (!room_id || !Array.isArray(registration_ids) || !registration_ids.length) {
    return fail('room_id and registration_ids[] are required');
  }
  const room = store.rooms.find((r) => r.id === Number(room_id));
  if (!room) return fail('Room not found');

  const currentOccupancy = store.allotments.filter((a) => a.room_id === Number(room_id)).length;
  const vacant = room.capacity - currentOccupancy;
  if (registration_ids.length > vacant) {
    return fail(`Room only has ${vacant} vacant slot(s); ${registration_ids.length} requested`);
  }

  const floor = store.floors.find((f) => f.id === room.floor_id);
  const building = floor ? store.buildings.find((b) => b.id === floor.building_id) : null;
  const place = building ? building.place : null;
  const placeRoomIds = place
    ? new Set(
        store.rooms
          .filter((r) => {
            const f = store.floors.find((fl) => fl.id === r.floor_id);
            const b = f ? store.buildings.find((bl) => bl.id === f.building_id) : null;
            return b && b.place === place;
          })
          .map((r) => r.id)
      )
    : null;

  const succeeded = [], failed = [];
  for (const registration_id of registration_ids) {
    const registration = store.registrations.find((r) => r.id === Number(registration_id));
    if (!registration) { failed.push({ registration_id, reason: 'Registration not found' }); continue; }
    if (placeRoomIds) {
      const alreadyAllotted = store.allotments.some(
        (a) => a.registration_id === Number(registration_id) && placeRoomIds.has(a.room_id)
      );
      if (alreadyAllotted) { failed.push({ registration_id, reason: 'Already allotted to a room' }); continue; }
    }
    const created = { id: nextAllotmentId, room_id: Number(room_id), registration_id: Number(registration_id) };
    nextAllotmentId += 1;
    store = { ...store, allotments: [...store.allotments, created] };
    succeeded.push(created);
  }
  return ok({ succeeded, failed }, `${succeeded.length} allotted, ${failed.length} failed`);
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

// Cascade-delete: floors + their rooms + their allotments.
export const mockDeleteBuilding = async (id) => {
  await delay();
  const buildingId = Number(id);
  const target = store.buildings.find((b) => b.id === buildingId);
  if (!target) return fail('Building not found');

  const removedFloors = store.floors.filter((f) => f.building_id === buildingId);
  const removedFloorIds = new Set(removedFloors.map((f) => f.id));
  const removedRooms = store.rooms.filter((r) => removedFloorIds.has(r.floor_id));
  const removedRoomIds = new Set(removedRooms.map((r) => r.id));
  const removedAllotments = store.allotments.filter((a) => removedRoomIds.has(a.room_id));

  store = {
    ...store,
    buildings: store.buildings.filter((b) => b.id !== buildingId),
    floors: store.floors.filter((f) => f.building_id !== buildingId),
    rooms: store.rooms.filter((r) => !removedFloorIds.has(r.floor_id)),
    allotments: store.allotments.filter((a) => !removedRoomIds.has(a.room_id)),
  };
  return ok(
    {
      id: buildingId,
      removed: {
        floors: removedFloors.length,
        rooms: removedRooms.length,
        allotments: removedAllotments.length,
      },
    },
    'Building deleted'
  );
};

// Cascade-delete: rooms + their allotments.
export const mockDeleteFloor = async (id) => {
  await delay();
  const floorId = Number(id);
  const target = store.floors.find((f) => f.id === floorId);
  if (!target) return fail('Floor not found');

  const removedRooms = store.rooms.filter((r) => r.floor_id === floorId);
  const removedRoomIds = new Set(removedRooms.map((r) => r.id));
  const removedAllotments = store.allotments.filter((a) => removedRoomIds.has(a.room_id));

  store = {
    ...store,
    floors: store.floors.filter((f) => f.id !== floorId),
    rooms: store.rooms.filter((r) => r.floor_id !== floorId),
    allotments: store.allotments.filter((a) => !removedRoomIds.has(a.room_id)),
  };
  return ok(
    {
      id: floorId,
      removed: {
        rooms: removedRooms.length,
        allotments: removedAllotments.length,
      },
    },
    'Floor deleted'
  );
};

// Cascade-delete: allotments in this room.
export const mockDeleteRoom = async (id) => {
  await delay();
  const roomId = Number(id);
  const target = store.rooms.find((r) => r.id === roomId);
  if (!target) return fail('Room not found');

  const removedAllotments = store.allotments.filter((a) => a.room_id === roomId);

  store = {
    ...store,
    rooms: store.rooms.filter((r) => r.id !== roomId),
    allotments: store.allotments.filter((a) => a.room_id !== roomId),
  };
  return ok(
    { id: roomId, removed: { allotments: removedAllotments.length } },
    'Room deleted'
  );
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

// ---------------------------------------------------------------------------
// Phase 3 — Timetable & Announcements seed data
// ---------------------------------------------------------------------------

const buildTimetableSeed = (place, items) =>
  items.map((it, idx) => ({ id: idx + 1 + (place === 'phagwara' ? 0 : place === 'abohar' ? 100 : 200), place, ...it }));

const phagwaraSeed = buildTimetableSeed('phagwara', [
  { day: 1, start_time: '16:00', end_time: '17:00', title: 'Arrival & Registration', location: 'Hall', notes: null },
  { day: 1, start_time: '18:00', end_time: '19:00', title: 'Welcome Mass',           location: 'Chapel', notes: null },
  { day: 2, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 2, start_time: '09:00', end_time: '11:00', title: 'Talk: Identity in Christ',location: 'Hall',   notes: null },
  { day: 2, start_time: '14:00', end_time: '16:00', title: 'Group Activities',        location: 'Grounds',notes: null },
  { day: 2, start_time: '19:00', end_time: '21:00', title: 'Evening Praise & Worship',location: 'Chapel', notes: null },
  { day: 3, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 3, start_time: '09:30', end_time: '10:30', title: 'Closing Mass',            location: 'Chapel', notes: null },
  { day: 3, start_time: '11:00', end_time: '11:30', title: 'Send-off',                location: 'Gate',   notes: null },
]);

const aboharSeed = buildTimetableSeed('abohar', [
  { day: 1, start_time: '16:00', end_time: '17:00', title: 'Arrival & Registration', location: 'Hall', notes: null },
  { day: 1, start_time: '18:00', end_time: '19:00', title: 'Welcome Mass',           location: 'Chapel', notes: null },
  { day: 2, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 2, start_time: '09:00', end_time: '11:00', title: 'Talk: Identity in Christ',location: 'Hall',   notes: null },
  { day: 2, start_time: '14:00', end_time: '16:00', title: 'Group Activities',        location: 'Grounds',notes: null },
  { day: 2, start_time: '19:00', end_time: '21:00', title: 'Evening Praise & Worship',location: 'Chapel', notes: null },
  { day: 3, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 3, start_time: '09:30', end_time: '10:30', title: 'Closing Mass',            location: 'Chapel', notes: null },
  { day: 3, start_time: '11:00', end_time: '11:30', title: 'Send-off',                location: 'Gate',   notes: null },
]);

const amritsarSeed = buildTimetableSeed('amritsar', [
  { day: 1, start_time: '16:00', end_time: '17:00', title: 'Arrival & Registration', location: 'Hall', notes: null },
  { day: 1, start_time: '18:00', end_time: '19:00', title: 'Welcome Mass',           location: 'Chapel', notes: null },
  { day: 2, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 2, start_time: '09:00', end_time: '11:00', title: 'Talk: Identity in Christ',location: 'Hall',   notes: null },
  { day: 2, start_time: '14:00', end_time: '16:00', title: 'Group Activities',        location: 'Grounds',notes: null },
  { day: 2, start_time: '19:00', end_time: '21:00', title: 'Evening Praise & Worship',location: 'Chapel', notes: null },
  { day: 3, start_time: '07:00', end_time: '08:00', title: 'Morning Prayer',          location: 'Chapel', notes: null },
  { day: 3, start_time: '09:30', end_time: '10:30', title: 'Closing Mass',            location: 'Chapel', notes: null },
  { day: 3, start_time: '11:00', end_time: '11:30', title: 'Send-off',                location: 'Gate',   notes: null },
]);

const seedTimetable = [...phagwaraSeed, ...aboharSeed, ...amritsarSeed];

const ISO_NOW = new Date().toISOString();
const seedAnnouncements = [
  { id: 1, place: 'phagwara', title: 'Bus timings confirmed',    body: 'Bus from Hoshiarpur at 14:00 sharp.', created_at: ISO_NOW },
  { id: 2, place: 'abohar',   title: 'Registration deadline',    body: 'Please register by 30 May.',          created_at: ISO_NOW },
  { id: 3, place: null,       title: 'Diocese-wide notice',       body: 'All coordinators please check WhatsApp group.', created_at: ISO_NOW },
];

store = {
  ...store,
  timetable: seedTimetable,
  announcements: seedAnnouncements,
};

let nextTimetableId = seedTimetable.length + 1;
let nextAnnouncementId = seedAnnouncements.length + 1;

// ---------------------------------------------------------------------------
// Phase 3 — Timetable mock functions
// ---------------------------------------------------------------------------

export const mockGetTimetable = async (params) => {
  await delay();
  const { place } = params || {};
  const filtered = place
    ? store.timetable.filter((it) => it.place === place)
    : store.timetable;
  const sorted = [...filtered].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.start_time > b.start_time ? 1 : -1;
  });
  // Return shape matches real backend: { place, items: [...], count }
  return ok({ place: place || null, items: sorted, count: sorted.length }, 'Timetable fetched');
};

export const mockCreateTimetableItem = async (body) => {
  await delay();
  const { place, day, start_time, end_time, title } = body || {};
  if (!place || !day || !start_time || !end_time || !title) {
    return fail('place, day, start_time, end_time, and title are required');
  }
  const created = { id: nextTimetableId, ...body };
  nextTimetableId += 1;
  store = { ...store, timetable: [...store.timetable, created] };
  return ok(created, 'Timetable item created');
};

export const mockUpdateTimetableItem = async (id, body) => {
  await delay();
  const target = store.timetable.find((it) => it.id === Number(id));
  if (!target) return fail('Timetable item not found');
  const updated = { ...target, ...body, id: target.id };
  store = {
    ...store,
    timetable: store.timetable.map((it) => (it.id === Number(id) ? updated : it)),
  };
  return ok(updated, 'Timetable item updated');
};

export const mockDeleteTimetableItem = async (id) => {
  await delay();
  const target = store.timetable.find((it) => it.id === Number(id));
  if (!target) return fail('Timetable item not found');
  store = {
    ...store,
    timetable: store.timetable.filter((it) => it.id !== Number(id)),
  };
  return ok({ id: Number(id) }, 'Timetable item deleted');
};

export const mockGetTimetableLive = async (params) => {
  await delay();
  const { place } = params || {};
  const items = place
    ? store.timetable.filter((it) => it.place === place)
    : store.timetable;

  // Use Day 1 in mock since it's hard to simulate real event days
  const dayItems = items.filter((it) => it.day === 1);

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const sorted = [...dayItems].sort((a, b) => (a.start_time > b.start_time ? 1 : -1));

  const current = sorted.find((it) => it.start_time <= hhmm && hhmm < it.end_time) || null;
  const upcoming = sorted.find((it) => it.start_time > hhmm) || null;

  return ok({ now: current, next: upcoming }, 'Live data fetched');
};

// ---------------------------------------------------------------------------
// Phase 3 — Announcements mock functions
// ---------------------------------------------------------------------------

export const mockGetAnnouncements = async (params) => {
  await delay();
  const { place } = params || {};
  const filtered = store.announcements.filter(
    (ann) => ann.place === place || ann.place === null
  );
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  // Return shape matches real backend: { place, announcements: [...], count }
  return ok({ place: place || null, announcements: sorted, count: sorted.length }, 'Announcements fetched');
};

export const mockCreateAnnouncement = async (body) => {
  await delay();
  const { title, body: bodyText } = body || {};
  if (!title || !title.trim()) return fail('title is required');
  if (!bodyText || !bodyText.trim()) return fail('body is required');
  const created = {
    id: nextAnnouncementId,
    place: body.place !== undefined ? body.place : null,
    title: title.trim(),
    body: bodyText.trim(),
    created_at: new Date().toISOString(),
  };
  nextAnnouncementId += 1;
  store = { ...store, announcements: [...store.announcements, created] };
  return ok(created, 'Announcement created');
};

export const mockDeleteAnnouncement = async (id) => {
  await delay();
  const target = store.announcements.find((ann) => ann.id === Number(id));
  if (!target) return fail('Announcement not found');
  store = {
    ...store,
    announcements: store.announcements.filter((ann) => ann.id !== Number(id)),
  };
  return ok({ id: Number(id) }, 'Announcement deleted');
};

// ---------------------------------------------------------------------------
// Participant self-view + Role management seed data
// ---------------------------------------------------------------------------

// Seed users for admin role-management search. These represent profile_holders
// who have CYD login accounts (user_id set) or don't (user_id null).
const seedUserList = [
  {
    profile_id: 1, profile_name: 'Aaron Masih', phone: '9870000001',
    deanery: 'Hoshiarpur', parish: 'Hoshiarpur', photo_url: null,
    user_id: 101, username: 'aaron', email: 'aaron@cyd.org',
    system_role: 'profile_holder', event_role: 'none', loc_place: null,
  },
  {
    profile_id: 4, profile_name: 'Diana Daniel', phone: '9870000004',
    deanery: 'Jalandhar City', parish: 'Jalandhar City', photo_url: null,
    user_id: 102, username: 'diana', email: 'diana@cyd.org',
    system_role: 'profile_holder', event_role: 'loc', loc_place: 'phagwara',
  },
  {
    profile_id: 7, profile_name: 'Gabriel Lall', phone: '9870000007',
    deanery: 'Kapurthala', parish: 'Kapurthala', photo_url: null,
    user_id: 103, username: 'gabriel', email: 'gabriel@cyd.org',
    system_role: 'profile_holder', event_role: 'dexco', loc_place: null,
  },
  {
    profile_id: 10, profile_name: 'Joanna Peter', phone: '9870000010',
    deanery: 'Moga', parish: 'Moga', photo_url: null,
    user_id: 104, username: 'joanna', email: 'joanna@cyd.org',
    system_role: 'profile_holder', event_role: 'loc', loc_place: 'abohar',
  },
  {
    profile_id: 13, profile_name: 'Mark Paul', phone: '9870000013',
    deanery: 'Tarn Taran', parish: 'Tarn Taran', photo_url: null,
    user_id: 105, username: 'mark', email: 'mark@cyd.org',
    system_role: 'profile_holder', event_role: 'loc', loc_place: 'amritsar',
  },
  {
    profile_id: 16, profile_name: 'Oliver Lall', phone: '9870000016',
    deanery: 'Amritsar', parish: 'Amritsar Cantt.', photo_url: null,
    user_id: null, username: null, email: null,
    system_role: null, event_role: 'none', loc_place: null,
  },
  {
    profile_id: 19, profile_name: 'Samuel Thomas', phone: '9870000019',
    deanery: 'Gurdaspur', parish: 'Gurdaspur', photo_url: null,
    user_id: 106, username: 'samuel', email: 'samuel@cyd.org',
    system_role: 'profile_holder', event_role: 'none', loc_place: null,
  },
];

store = { ...store, userList: seedUserList };

// ---------------------------------------------------------------------------
// Participant self-view mock (simulates the logged-in youth: registration 1)
// ---------------------------------------------------------------------------

export const mockGetMyEvent = async () => {
  await delay();
  // In mock, the logged-in youth is registration id=1 (Aaron Masih, Hoshiarpur → phagwara)
  const userReg = store.registrations.find((r) => r.id === 1);
  if (!userReg) {
    return ok({ registered: false }, 'Not registered');
  }

  // Find allotment
  const allotment = store.allotments.find((a) => a.registration_id === userReg.id);
  let room = null;
  if (allotment) {
    const r = store.rooms.find((rm) => rm.id === allotment.room_id);
    const f = r ? store.floors.find((fl) => fl.id === r.floor_id) : null;
    const b = f ? store.buildings.find((bld) => bld.id === f.building_id) : null;
    const roommateAllotments = store.allotments.filter(
      (a) => a.room_id === allotment.room_id && a.registration_id !== userReg.id
    );
    const roommates = roommateAllotments.map((a) => {
      const reg = store.registrations.find((reg2) => reg2.id === a.registration_id);
      const profile = reg ? store.eligibleProfiles.find((p) => p.id === reg.profile_id) : null;
      return {
        name: profile ? profile.name : 'Unknown',
        parish: profile ? profile.parish : '-',
        photo_url: profile ? profile.photo_url || null : null,
        is_independent: profile ? profile.is_independent || 0 : 0,
      };
    });
    room = {
      building: b ? b.name : '-',
      floor: f ? f.name : '-',
      room: r ? r.name : '-',
      roommates,
    };
  }

  const timetable = store.timetable
    .filter((it) => it.place === userReg.place)
    .sort((a, b) => (a.day !== b.day ? a.day - b.day : a.start_time > b.start_time ? 1 : -1));

  const announcements = store.announcements
    .filter((ann) => ann.place === userReg.place || ann.place === null)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return ok(
    {
      registered: true,
      place: userReg.place,
      registration: enrichRegistration(userReg),
      room,
      timetable,
      announcements,
    },
    'My event data'
  );
};

// ---------------------------------------------------------------------------
// Role management mock functions
// ---------------------------------------------------------------------------

export const mockSearchUsers = async (q) => {
  await delay();
  if (!q || !q.trim()) return ok({ results: [], count: 0 }, 'No query');
  const needle = q.trim().toLowerCase();
  const results = store.userList.filter(
    (u) =>
      u.profile_name.toLowerCase().includes(needle) ||
      u.phone.includes(needle)
  );
  return ok({ results, count: results.length }, 'Search results');
};

export const mockGrantRole = async (body) => {
  await delay();
  const { event_role, loc_place, user_id, profile_id } = body || {};
  if (!event_role) return fail('event_role is required');
  if (event_role === 'loc' && !loc_place) return fail('loc_place is required for loc role');

  const idx = store.userList.findIndex((u) =>
    user_id ? u.user_id === Number(user_id) : u.profile_id === Number(profile_id)
  );
  if (idx === -1) return fail('User not found');
  if (!store.userList[idx].user_id) return fail('Cannot promote: no login account');

  const updated = {
    ...store.userList[idx],
    event_role,
    loc_place: event_role === 'loc' ? loc_place : null,
  };
  const newList = [...store.userList];
  newList[idx] = updated;
  store = { ...store, userList: newList };
  return ok(updated, 'Role updated');
};

export const mockListRoles = async () => {
  await delay();
  const granted = store.userList.filter((u) => u.event_role && u.event_role !== 'none');
  return ok({ roles: granted }, 'Roles listed');
};

// ---------------------------------------------------------------------------
// Speakers seed + mock functions
// Mirrors live shape exactly (BUG-001 lesson): list returns the wrapper
// { speakers: [...], count } — never a bare array. create/update return
// { speaker }. Delete is a soft delete (status -> 0); the admin list still
// returns drafts (status 0), matching the contract.
// ---------------------------------------------------------------------------

const seedSpeakers = [
  { id: 1, place: null,        name: 'Most Rev. Bishop',     role: 'Keynote Speaker',  bio: 'Shepherd of the diocese, opening the retreat.', photo_url: null, sort_order: 0, status: 1 },
  { id: 2, place: 'phagwara',  name: 'Fr. Thomas',           role: 'Retreat Preacher', bio: 'Leading the Phagwara sessions.',                photo_url: null, sort_order: 1, status: 1 },
  { id: 3, place: 'abohar',    name: 'Sr. Grace',            role: 'Worship Leader',   bio: 'Praise & worship animation.',                   photo_url: null, sort_order: 1, status: 1 },
  { id: 4, place: 'amritsar',  name: 'Bro. Daniel',          role: 'Youth Animator',   bio: '',                                              photo_url: null, sort_order: 2, status: 1 },
];

store = { ...store, speakers: seedSpeakers };

let nextSpeakerId = seedSpeakers.length + 1;

const sortSpeakers = (list) =>
  [...list].sort((a, b) => {
    if ((a.sort_order || 0) !== (b.sort_order || 0)) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return String(a.name).localeCompare(String(b.name));
  });

export const mockListSpeakers = async () => {
  await delay();
  // Full list INCLUDING drafts (status 0), ordered by sort_order then name.
  const speakers = sortSpeakers(store.speakers);
  return ok({ speakers, count: speakers.length }, 'Speakers fetched');
};

export const mockCreateSpeaker = async (body) => {
  await delay();
  const { name, role } = body || {};
  if (!name || !name.trim()) return fail('name is required');
  if (!role || !role.trim()) return fail('role is required');
  const created = {
    id: nextSpeakerId,
    place: body.place !== undefined ? body.place : null,
    name: name.trim(),
    role: role.trim(),
    bio: (body.bio || '').trim(),
    photo_url: (body.photo_url || '').trim() || null,
    sort_order: Number(body.sort_order) || 0,
    status: 1,
  };
  nextSpeakerId += 1;
  store = { ...store, speakers: [...store.speakers, created] };
  return ok({ speaker: created }, 'Speaker added');
};

export const mockUpdateSpeaker = async (id, body) => {
  await delay();
  const target = store.speakers.find((s) => s.id === Number(id));
  if (!target) return fail('Speaker not found');
  const patch = { ...body };
  if (patch.name !== undefined) patch.name = String(patch.name).trim();
  if (patch.role !== undefined) patch.role = String(patch.role).trim();
  if (patch.bio !== undefined) patch.bio = String(patch.bio).trim();
  if (patch.photo_url !== undefined) patch.photo_url = String(patch.photo_url).trim() || null;
  if (patch.sort_order !== undefined) patch.sort_order = Number(patch.sort_order) || 0;
  const updated = { ...target, ...patch, id: target.id };
  store = {
    ...store,
    speakers: store.speakers.map((s) => (s.id === Number(id) ? updated : s)),
  };
  return ok({ speaker: updated }, 'Speaker updated');
};

export const mockDeleteSpeaker = async (id) => {
  await delay();
  const target = store.speakers.find((s) => s.id === Number(id));
  if (!target) return fail('Speaker not found');
  // Soft delete: status -> 0 (matches contract; still returned by the admin list).
  const updated = { ...target, status: 0 };
  store = {
    ...store,
    speakers: store.speakers.map((s) => (s.id === Number(id) ? updated : s)),
  };
  return ok({ speaker: updated }, 'Speaker removed');
};

// ---------------------------------------------------------------------------
// Option B — Independent entries (profile rows with is_independent=1).
// List shape mirrors live exactly: { place, independents: [...], count }.
// Each row maps the internal profile-style `dob` to the contract `date_of_birth`
// and carries a computed `id_card_complete` (true when nothing is missing).
// ---------------------------------------------------------------------------

const failWith = (message, data, status) => ({
  success: false,
  message: message || 'Error',
  data: data || null,
  status,
});

// Build the contract-shaped independent row from an internal profile record.
const toIndependentRow = (p) => {
  const row = {
    id: p.id,
    name: p.name,
    father_name: p.father_name || null,
    date_of_birth: p.dob || null,
    phone: p.phone || null,
    deanery: p.deanery,
    parish: p.parish,
    level: p.level || null,
    designation: p.designation || null,
    postal_address: p.postal_address || null,
    photo_url: p.photo_url || null,
    is_independent: 1,
    place: DEANERY_TO_PLACE[p.deanery] || null,
  };
  return { ...row, id_card_complete: missingIdCardFields(row).length === 0 };
};

const findIndependent = (id) =>
  store.eligibleProfiles.find(
    (p) => p.id === Number(id) && p.is_independent === 1
  );

export const mockGetIndependents = async (params) => {
  await delay();
  const { place, deanery, parish, search } = params || {};
  const rows = store.eligibleProfiles
    .filter((p) => p.is_independent === 1)
    .filter((p) => {
      if (place && DEANERY_TO_PLACE[p.deanery] !== place) return false;
      if (deanery && p.deanery !== deanery) return false;
      if (parish && p.parish !== parish) return false;
      if (!matchesSearch(p, search)) return false;
      return true;
    })
    .map(toIndependentRow);
  return ok(
    { place: place || null, independents: rows, count: rows.length },
    'Independents fetched'
  );
};

export const mockCreateIndependent = async (body) => {
  await delay();
  const { place, deanery, parish, name } = body || {};
  const missingFields = [];
  if (!name || !name.trim()) missingFields.push('name');
  if (!deanery) missingFields.push('deanery');
  if (!parish) missingFields.push('parish');
  if (!place) missingFields.push('place');
  if (missingFields.length) {
    return failWith('Missing required fields', { missing_fields: missingFields }, 400);
  }
  const created = {
    id: nextProfileId,
    name: name.trim(),
    parish,
    deanery,
    phone: body.phone || null,
    dob: body.date_of_birth || null,
    father_name: body.father_name || null,
    photo_url: body.photo_url || null,
    level: body.level || null,
    designation: body.designation || null,
    postal_address: body.postal_address || null,
    is_independent: 1,
  };
  nextProfileId += 1;
  store = { ...store, eligibleProfiles: [...store.eligibleProfiles, created] };
  return ok(
    { profile_id: created.id, independent: toIndependentRow(created) },
    'Independent entry created'
  );
};

export const mockUpdateIndependent = async (id, body) => {
  await delay();
  const target = findIndependent(id);
  if (!target) return fail('Independent entry not found');
  const patch = { ...(body || {}) };
  // Map contract field date_of_birth -> internal dob.
  if ('date_of_birth' in patch) {
    patch.dob = patch.date_of_birth;
    delete patch.date_of_birth;
  }
  const updated = { ...target, ...patch, id: target.id, is_independent: 1 };
  store = {
    ...store,
    eligibleProfiles: store.eligibleProfiles.map((p) =>
      p.id === target.id ? updated : p
    ),
  };
  return ok({ independent: toIndependentRow(updated) }, 'Independent entry updated');
};

export const mockDeleteIndependent = async (id) => {
  await delay();
  const target = findIndependent(id);
  if (!target) return fail('Independent entry not found');
  const hasActiveReg = store.registrations.some(
    (r) => r.profile_id === target.id
  );
  if (hasActiveReg) {
    return failWith('Cannot delete: an active registration exists', null, 409);
  }
  store = {
    ...store,
    eligibleProfiles: store.eligibleProfiles.filter((p) => p.id !== target.id),
  };
  return ok({ id: target.id }, 'Independent entry deleted');
};

export const mockPromoteIndependent = async (id, body) => {
  await delay();
  const target = findIndependent(id);
  if (!target) return fail('Independent entry not found');
  // Body fills gaps only (non-empty values win). Contract field names map to internal.
  const fieldMap = { date_of_birth: 'dob' };
  const merged = { ...target };
  Object.entries(body || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[fieldMap[key] || key] = value;
    }
  });
  const row = toIndependentRow(merged);
  const missing = missingIdCardFields(row);
  if (missing.length) {
    return failWith('Cannot promote: required fields are missing', { missing_fields: missing }, 400);
  }
  // Promote: flip is_independent to 0 → becomes an ordinary ID-card profile.
  const promoted = { ...merged, is_independent: 0 };
  store = {
    ...store,
    eligibleProfiles: store.eligibleProfiles.map((p) =>
      p.id === target.id ? promoted : p
    ),
  };
  // Credentials per contract: username = first 4 letters of name + DDMM of DOB;
  // password = the youth's phone digits.
  const first4 = String(promoted.name).replace(/[^a-zA-Z]/g, '').slice(0, 4).toLowerCase();
  const dob = promoted.dob ? new Date(promoted.dob) : null;
  const ddmm = dob && !Number.isNaN(dob.getTime())
    ? `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}`
    : '0000';
  const username = `${first4}${ddmm}`;
  return ok(
    {
      profile: promoted,
      credentials: {
        username,
        password_hint: 'phone number',
        message: "Password is the youth's phone number — share this so they can log in.",
      },
    },
    'Independent promoted to full profile'
  );
};
