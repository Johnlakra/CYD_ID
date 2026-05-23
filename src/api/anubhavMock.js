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
