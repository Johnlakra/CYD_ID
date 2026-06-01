# Anubhav 2026 — API Contract (shared boundary)

Base URL: same as existing (`https://cyd-id-be.onrender.com`). All new routes are
namespaced under `/anubhav` so nothing existing is touched. All require
`authenticateToken`. Place-scoped routes additionally require `requireEventRole`
(see middleware) and enforce LOC place scoping server-side.

`place` is always one of: `phagwara` | `abohar` | `amritsar`.
Standard response envelope (unchanged from existing app): `{ success, message, data }`.

## Roles / promotion
```
GET   /anubhav/me/role                      -> { event_role, loc_place }
POST  /anubhav/roles/grant   (admin; dexco may grant loc)
                             body: { profile_id|user_id, event_role, loc_place? }
                             // profile_id OR user_id — one is required
GET   /anubhav/roles                         (admin) -> list of granted users
GET   /anubhav/users/search?q=               (admin) -> search profiles by name/phone
                             -> [{ profile_id, profile_name, phone, deanery, parish, photo_url,
                                   user_id|null, username, email, system_role, event_role, loc_place }]
                             // user_id=null means no login account; cannot be promoted
```

## Registration (Phase 1)
```
GET   /anubhav/eligible?place=&deanery=&parish=&search=   -> profiles eligible for that place
POST  /anubhav/registrations         { place, profile_id, chaperone_id? }
GET   /anubhav/registrations?place=&deanery=&parish=      -> registered youth + counts
DELETE/anubhav/registrations/:id
GET   /anubhav/chaperones?place=&parish=                  -> chaperones for a parish group
POST  /anubhav/chaperones            { place, parish, name, phone, type }  // Sister | Catechist
GET   /anubhav/fees?place=           -> { perYouth:50, byParish:[{deanery,parish,count,total}], byDeanery:[{deanery,count,total}], placeTotal:number, placeCount:number, overall:number, overallCount:number }
```

## Accommodation (Phase 2)
```
POST  /anubhav/buildings             { place, name }
GET   /anubhav/buildings?place=      -> buildings -> floors -> rooms (nested, with capacity & occupancy)
                                        Each room.occupants[i] now MUST include photo_url (nullable).
DELETE/anubhav/buildings/:id         // admin/dexco only — cascades floors, rooms, allotments
POST  /anubhav/floors                { building_id, name, level }
DELETE/anubhav/floors/:id            // admin/dexco only — cascades rooms, allotments
POST  /anubhav/rooms                 { floor_id, name, capacity }
DELETE/anubhav/rooms/:id             // admin/dexco only — cascades allotments
POST  /anubhav/allotments            { room_id, registration_id }
DELETE/anubhav/allotments/:id
GET   /anubhav/rooming?place=&building_id?&floor_id?&room_id?  -> data shaped for PDF generation
```

## Timetable + Announcements (Phase 3)
```
POST  /anubhav/timetable             { place, day, start_time, end_time, title, location, notes }
GET   /anubhav/timetable?place=      -> ordered items
PUT   /anubhav/timetable/:id
DELETE/anubhav/timetable/:id
GET   /anubhav/timetable/live?place= -> { now, next }

POST  /anubhav/announcements         { place|null, title, body }   // null place = diocese-wide (dexco only)
GET   /anubhav/announcements?place=  -> active announcements for that place + diocese-wide
DELETE/anubhav/announcements/:id
```

## Phase 4 — Participant self-view
```
GET   /anubhav/my/event                      -> self-scoped; no place param; no event-role required
      Resolves: users.id → profile (profile_user_id) → anubhav_registrations (status=1)
      Response: {
        registered: bool,
        // if registered=false, no further fields
        place: "phagwara"|"abohar"|"amritsar",
        venue: null,                          // reserved; not yet in schema
        dates: ["YYYY-MM-DD", ...],           // distinct days from timetable
        room: {
          building: string,
          floor: string,
          room: string,
          roommates: [{ name, parish }]       // name + parish ONLY — no phone (participant-facing)
        } | null,
        timetable: [...],                     // same shape as GET /anubhav/timetable
        live: { now: item|null, next: item|null },
        announcements: [...]                  // place-scoped + diocese-wide combined
      }
```
**Role deassign path:** `POST /anubhav/roles/grant` with `event_role: "none"` is the deassign
path — it clears `loc_place` to `null`. No separate deassign endpoint is needed.

## Option B — Independent entries
Youth who register directly for Anubhav without an existing ID-card profile. They are
stored as `profile` rows with `is_independent = 1` and are **never** returned by `/profiles`.

Existing list rows now carry an `is_independent` (0|1) flag so the UI can badge them:
```
GET /anubhav/eligible        -> each row includes is_independent (0|1)
GET /anubhav/registrations   -> each row includes is_independent (0|1)
GET /anubhav/rooming         -> each occupant includes is_independent (0|1) + photo_url
```

Independent-entry endpoints (admin / dexco / loc; loc is place-scoped):
```
POST  /anubhav/independents
      body: { place, deanery, parish, name,
              father_name?, phone?, date_of_birth?, level?, designation?, postal_address?, photo_url? }
      required: name, deanery, parish, place
      -> 201 { profile_id, independent }
      -> 400 { message, missing_fields:[...] }   // when a required field is absent

GET   /anubhav/independents?place=&deanery=&parish=&search=
      -> { place,
           independents: [{ id, name, father_name, date_of_birth, phone, deanery, parish,
                            level, designation, postal_address, photo_url, is_independent,
                            place, id_card_complete:bool }],
           count }
      // ONLY is_independent=1 rows. id_card_complete=true when every ID-card field is present.

PUT   /anubhav/independents/:id            // all fields optional (patch)
DELETE/anubhav/independents/:id            // soft delete; 409 if an active registration exists

POST  /anubhav/independents/:id/promote    // ADMIN ONLY — turns the entry into a full profile
      body fills any remaining gaps. ALL ID-card-required fields must end up present,
      else -> 400 { message, missing_fields:[...] }
      -> 200 { profile, credentials: { username, password_hint, message } }
      // username = first 4 letters of name + DDMM of DOB; password = the youth's phone digits
```

ID-card-required fields (drive `id_card_complete`, promote gating, and print gating):
`name, father_name (col father), deanery, parish, date_of_birth (col dob), phone,
postal_address, level, designation, photo_url`.

`/profiles` changes for Option B:
```
GET /profiles                -> now EXCLUDES independents (server-side AND p.is_independent = 0)
GET /profiles/:id/idcard-data -> gates printing:
      200 full profile only when complete,
      else 400 { success:false, message, missing_fields:[...] }   // same completeness rule
```

## Notes for the frontend session
- All list endpoints already return counts where useful; do fee math display only,
  never recompute authoritative totals client-side.
- `/anubhav/rooming` returns everything jsPDF needs (place, building, floor, room,
  occupant name/parish/phone) so PDFs need no extra calls.
- 401 handling, token header, and `baseURL` reuse the existing `apiClient`.
