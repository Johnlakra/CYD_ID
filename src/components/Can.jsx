// Multi-diocese platform — <Can> permission gate (Phase 3).
// Wraps NEW UI only (tabs, buttons, sections); legacy role checks stay as-is.
// Hidden while permissions load and on any resolution failure — the gate can
// only ever narrow what a user sees, never widen it.
//
//   <Can perm={PERM.EVENTS_CREATE}><Button .../></Can>
//   <Can perm={[PERM.ORG_MANAGE, PERM.IMPORTS_RUN]} fallback={<ReadOnlyNote/>}>
//
// An array grants access when ANY listed key is held.

import { usePermissions } from '../utils/usePermissions';

const Can = ({ perm, fallback = null, children }) => {
  const { can, loading } = usePermissions();

  if (loading) return fallback;

  const required = Array.isArray(perm) ? perm : [perm];
  const allowed = required.some((permKey) => can(permKey));

  return allowed ? children : fallback;
};

export default Can;
