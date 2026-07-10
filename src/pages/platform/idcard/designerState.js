// Platform Phase 4 — designer reducer (Pillar D).
// Pure, immutable state transitions for the ID card designer: element CRUD,
// placement, layering, zoom/snap, and a bounded undo history.

import {
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  MAX_UNDO_STATES,
  clampToCard,
  createElement,
} from '../../../utils/idCardLayout';

export const DEFAULT_ZOOM = 0.55;
export const ZOOM_STEPS = [0.35, 0.45, 0.55, 0.7, 0.85, 1];

const blankMeta = () => ({
  id: null,
  name: 'Untitled card',
  level: 'parish',
  background_url: null,
  width_mm: CARD_WIDTH_MM,
  height_mm: CARD_HEIGHT_MM,
});

export const initDesignerState = (template = null) => ({
  meta: template
    ? {
        id: template.id || null,
        name: template.name || 'Untitled card',
        level: template.level || 'parish',
        background_url: template.background_url || null,
        width_mm: Number(template.width_mm) || CARD_WIDTH_MM,
        height_mm: Number(template.height_mm) || CARD_HEIGHT_MM,
      }
    : blankMeta(),
  elements:
    template && template.layout_json && Array.isArray(template.layout_json.elements)
      ? template.layout_json.elements
      : [],
  selectedId: null,
  zoom: DEFAULT_ZOOM,
  snap: true,
  history: [],
  dirty: false,
});

// Snapshot of everything undo restores.
const pushHistory = (state) => {
  const entry = { meta: state.meta, elements: state.elements };
  const history = [...state.history, entry];
  return history.length > MAX_UNDO_STATES ? history.slice(1) : history;
};

const withEdit = (state, patch) => ({
  ...state,
  ...patch,
  history: pushHistory(state),
  dirty: true,
});

export const designerReducer = (state, action) => {
  switch (action.type) {
    case 'load':
      return initDesignerState(action.template);

    case 'select':
      return { ...state, selectedId: action.id };

    case 'add-element': {
      const element = createElement(state.elements, action.elementType, action.overrides);
      return withEdit(state, {
        elements: [...state.elements, element],
        selectedId: element.id,
      });
    }

    case 'remove-element':
      return withEdit(state, {
        elements: state.elements.filter((el) => el.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      });

    case 'update-element':
      return withEdit(state, {
        elements: state.elements.map((el) =>
          el.id === action.id
            ? clampToCard({ ...el, ...action.patch }, state.meta.width_mm, state.meta.height_mm)
            : el
        ),
      });

    // Drag/resize commit — same as update-element but named for clarity.
    case 'place-element':
      return withEdit(state, {
        elements: state.elements.map((el) =>
          el.id === action.id
            ? clampToCard({ ...el, ...action.frame }, state.meta.width_mm, state.meta.height_mm)
            : el
        ),
      });

    // Array order = paint order: later elements stack on top.
    case 'layer': {
      const index = state.elements.findIndex((el) => el.id === action.id);
      const target = action.direction === 'up' ? index + 1 : index - 1;
      if (index < 0 || target < 0 || target >= state.elements.length) return state;
      const elements = [...state.elements];
      [elements[index], elements[target]] = [elements[target], elements[index]];
      return withEdit(state, { elements });
    }

    case 'set-meta':
      return withEdit(state, { meta: { ...state.meta, ...action.patch } });

    case 'set-zoom':
      return { ...state, zoom: action.zoom };

    case 'toggle-snap':
      return { ...state, snap: !state.snap };

    case 'undo': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        meta: previous.meta,
        elements: previous.elements,
        history: state.history.slice(0, -1),
        dirty: true,
      };
    }

    case 'saved':
      return {
        ...state,
        meta: { ...state.meta, id: action.template.id },
        dirty: false,
      };

    default:
      return state;
  }
};

// layout_json payload for save calls.
export const toLayoutJson = (state) => ({ elements: state.elements });
