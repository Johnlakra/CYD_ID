// Phase 4 — designer reducer: element CRUD, layering, undo, immutability.

import {
  designerReducer,
  initDesignerState,
  toLayoutJson,
} from './designerState';
import { CARD_WIDTH_MM, MAX_UNDO_STATES } from '../../../utils/idCardLayout';

const stateWithElements = () => {
  let state = initDesignerState();
  state = designerReducer(state, { type: 'add-element', elementType: 'photo' });
  state = designerReducer(state, {
    type: 'add-element',
    elementType: 'text',
    overrides: { field: 'phone' },
  });
  return state;
};

describe('designerReducer', () => {
  test('initialises blank state with card defaults', () => {
    // Act
    const state = initDesignerState();

    // Assert
    expect(state.elements).toEqual([]);
    expect(state.meta.width_mm).toBe(CARD_WIDTH_MM);
    expect(state.dirty).toBe(false);
  });

  test('initialises from an existing template', () => {
    // Arrange
    const template = {
      id: 7,
      name: 'My card',
      level: 'deanery',
      background_url: 'bg.png',
      layout_json: { elements: [{ id: 'el_1', type: 'text', field: 'name', x: 1, y: 2, w: 30, h: 10 }] },
    };

    // Act
    const state = initDesignerState(template);

    // Assert
    expect(state.meta.id).toBe(7);
    expect(state.meta.level).toBe('deanery');
    expect(state.elements).toHaveLength(1);
  });

  test('add-element appends, selects and marks dirty', () => {
    // Act
    const state = designerReducer(initDesignerState(), {
      type: 'add-element',
      elementType: 'text',
      overrides: { field: 'parish' },
    });

    // Assert
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].field).toBe('parish');
    expect(state.selectedId).toBe(state.elements[0].id);
    expect(state.dirty).toBe(true);
  });

  test('update-element patches immutably without touching siblings', () => {
    // Arrange
    const before = stateWithElements();
    const targetId = before.elements[1].id;

    // Act
    const after = designerReducer(before, {
      type: 'update-element',
      id: targetId,
      patch: { fontSize: 22 },
    });

    // Assert
    expect(after.elements[1].fontSize).toBe(22);
    expect(before.elements[1].fontSize).not.toBe(22);
    expect(after.elements[0]).toBe(before.elements[0]);
  });

  test('place-element clamps to the card bounds', () => {
    // Arrange
    const before = stateWithElements();
    const targetId = before.elements[0].id;

    // Act
    const after = designerReducer(before, {
      type: 'place-element',
      id: targetId,
      frame: { x: 9999, y: -5 },
    });

    // Assert
    const placed = after.elements[0];
    expect(placed.x + placed.w).toBeLessThanOrEqual(CARD_WIDTH_MM);
    expect(placed.y).toBe(0);
  });

  test('remove-element drops it and clears selection', () => {
    // Arrange
    const before = stateWithElements();
    const targetId = before.selectedId;

    // Act
    const after = designerReducer(before, { type: 'remove-element', id: targetId });

    // Assert
    expect(after.elements).toHaveLength(1);
    expect(after.selectedId).toBeNull();
  });

  test('layer up swaps paint order', () => {
    // Arrange
    const before = stateWithElements();
    const [first, second] = before.elements;

    // Act
    const after = designerReducer(before, { type: 'layer', id: first.id, direction: 'up' });

    // Assert
    expect(after.elements[0].id).toBe(second.id);
    expect(after.elements[1].id).toBe(first.id);
  });

  test('undo restores the previous snapshot', () => {
    // Arrange
    const before = stateWithElements();

    // Act
    const after = designerReducer(before, { type: 'undo' });

    // Assert
    expect(after.elements).toHaveLength(1);
    expect(after.history).toHaveLength(before.history.length - 1);
  });

  test('undo on empty history is a no-op', () => {
    // Arrange
    const state = initDesignerState();

    // Act / Assert
    expect(designerReducer(state, { type: 'undo' })).toBe(state);
  });

  test(`history is capped at ${MAX_UNDO_STATES} entries`, () => {
    // Arrange
    let state = initDesignerState();

    // Act
    for (let i = 0; i < MAX_UNDO_STATES + 10; i += 1) {
      state = designerReducer(state, { type: 'add-element', elementType: 'line' });
    }

    // Assert
    expect(state.history).toHaveLength(MAX_UNDO_STATES);
  });

  test('saved stores the new id and clears dirty', () => {
    // Arrange
    const before = stateWithElements();

    // Act
    const after = designerReducer(before, { type: 'saved', template: { id: 42 } });

    // Assert
    expect(after.meta.id).toBe(42);
    expect(after.dirty).toBe(false);
  });

  test('toLayoutJson wraps elements', () => {
    // Arrange
    const state = stateWithElements();

    // Assert
    expect(toLayoutJson(state)).toEqual({ elements: state.elements });
  });
});
