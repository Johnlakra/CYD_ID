// Platform Phase 4 — designer canvas. The card renders at natural mm size and
// is zoomed with `transform: scale()`, so element markup is identical to the
// final TemplateCardRenderer output (shared ElementContent = zero drift).
// react-rnd overlays drag/resize boxes; positions convert px↔mm on commit.

import React from 'react';
import { Box } from '@mui/material';
import { Rnd } from 'react-rnd';
import { ElementContent } from '../../../components/TemplateCardRenderer';
import { SNAP_GRID_MM, mmToPx, pxToMm } from '../../../utils/idCardLayout';

const GUIDE_STYLE = {
  position: 'absolute',
  background: 'rgba(25, 118, 210, 0.25)',
  pointerEvents: 'none',
};

const DesignerCanvas = ({ state, dispatch, sampleData }) => {
  const { meta, elements, selectedId, zoom, snap } = state;
  const widthPx = mmToPx(meta.width_mm);
  const heightPx = mmToPx(meta.height_mm);
  const gridPx = mmToPx(SNAP_GRID_MM);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        bgcolor: 'grey.900',
        p: 3,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Sized to the scaled card so scrollbars track the zoom level. */}
      <div style={{ width: widthPx * zoom, height: heightPx * zoom, flexShrink: 0 }}>
        <div
          data-testid="designer-card"
          style={{
            position: 'relative',
            width: widthPx,
            height: heightPx,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            backgroundImage: meta.background_url ? `url(${meta.background_url})` : undefined,
            backgroundColor: meta.background_url ? '#ffffff' : '#f5f5f5',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
          onMouseDown={() => dispatch({ type: 'select', id: null })}
        >
          {/* Center alignment guides */}
          {snap && (
            <>
              <div style={{ ...GUIDE_STYLE, left: widthPx / 2, top: 0, width: 1, height: '100%' }} />
              <div style={{ ...GUIDE_STYLE, top: heightPx / 2, left: 0, height: 1, width: '100%' }} />
            </>
          )}

          {elements.map((element, index) => (
            <Rnd
              key={element.id}
              scale={zoom}
              bounds="parent"
              size={{ width: mmToPx(element.w), height: mmToPx(element.h) }}
              position={{ x: mmToPx(element.x), y: mmToPx(element.y) }}
              dragGrid={snap ? [gridPx, gridPx] : undefined}
              resizeGrid={snap ? [gridPx, gridPx] : undefined}
              style={{
                zIndex: index + 1,
                outline:
                  element.id === selectedId
                    ? '2px solid #1976d2'
                    : '1px dashed rgba(25, 118, 210, 0.35)',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                dispatch({ type: 'select', id: element.id });
              }}
              onDragStop={(e, d) =>
                dispatch({
                  type: 'place-element',
                  id: element.id,
                  frame: { x: pxToMm(d.x), y: pxToMm(d.y) },
                })
              }
              onResizeStop={(e, direction, refEl, delta, position) =>
                dispatch({
                  type: 'place-element',
                  id: element.id,
                  frame: {
                    x: pxToMm(position.x),
                    y: pxToMm(position.y),
                    w: pxToMm(refEl.offsetWidth),
                    h: pxToMm(refEl.offsetHeight),
                  },
                })
              }
            >
              <div style={{ width: '100%', height: '100%', transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined }}>
                <ElementContent element={element} data={sampleData} />
              </div>
            </Rnd>
          ))}
        </div>
      </div>
    </Box>
  );
};

export default DesignerCanvas;
