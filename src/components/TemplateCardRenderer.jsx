// Platform Phase 4 — template-driven ID card renderer (Pillar D).
// ONE render path: the designer canvas, the gallery thumbnails and the final
// downloadable card all render elements through this file, so what you design
// is exactly what html-to-image exports. Positions are mm (like the legacy
// IDCard.jsx inline styles), fontSize is px.

import { forwardRef } from 'react';
import dayjs from 'dayjs';
import { capitalizeName } from '../utils/text-format';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM, DATE_FIELDS } from '../utils/idCardLayout';

// Neutral placeholder shown for photo/logo elements without a source image
// (designer preview, gallery thumbnails).
const PHOTO_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240">' +
      '<rect width="200" height="240" fill="#e0e0e0"/>' +
      '<circle cx="100" cy="90" r="40" fill="#bdbdbd"/>' +
      '<ellipse cx="100" cy="200" rx="65" ry="55" fill="#bdbdbd"/>' +
      '</svg>'
  );

// Field value with the same formatting the legacy card applies: name is
// capitalised, date fields print DD-MM-YYYY, everything else verbatim.
export const resolveFieldValue = (data, field) => {
  if (!field) return '';
  const raw = data ? data[field] : undefined;
  if (raw === undefined || raw === null || raw === '') return '';
  if (field === 'name') return capitalizeName(String(raw));
  if (DATE_FIELDS.includes(field)) return dayjs(raw).format('DD-MM-YYYY');
  return String(raw);
};

export const resolveElementText = (element, data) => {
  const value = element.type === 'static_text' ? '' : resolveFieldValue(data, element.field);
  const text = element.type === 'static_text'
    ? element.label || ''
    : element.label
      ? `${element.label} ${value}`
      : value;
  return element.uppercase ? text.toUpperCase() : text;
};

const textStyle = (element) => ({
  width: '100%',
  height: '100%',
  fontSize: `${element.fontSize || 16}px`,
  fontWeight: element.fontWeight || 400,
  color: element.color || '#1a1a1a',
  fontFamily: element.fontFamily && element.fontFamily !== 'inherit' ? element.fontFamily : undefined,
  textAlign: element.align || 'left',
  borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
  border: element.border || undefined,
  whiteSpace: element.wrap ? 'pre-wrap' : 'pre',
  lineHeight: element.lineHeight || undefined,
  overflow: 'visible',
});

// Element body only (no positioning) — the designer wraps this in react-rnd
// boxes, the final card wraps it in absolute mm boxes.
export const ElementContent = ({ element, data }) => {
  switch (element.type) {
    case 'photo':
      return (
        <img
          src={(data && data.photo) || PHOTO_PLACEHOLDER}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            border: element.border || undefined,
            borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
            display: 'block',
          }}
        />
      );
    case 'logo':
      return (
        <img
          src={(data && data.diocese_logo_url) || PHOTO_PLACEHOLDER}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
            display: 'block',
          }}
        />
      );
    case 'qr':
      // Real payload (CYD:<slug>:<qr_token>) arrives with Phase 6; until then
      // the element renders a clearly-marked placeholder.
      if (data && data.qr_image_url) {
        return <img src={data.qr_image_url} alt="QR" style={{ width: '100%', height: '100%' }} />;
      }
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px dashed #9e9e9e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#9e9e9e',
            fontFamily: 'Roboto',
            boxSizing: 'border-box',
          }}
        >
          QR
        </div>
      );
    case 'line':
      return (
        <div style={{ width: '100%', height: '100%', background: element.color || '#1a1a1a' }} />
      );
    default:
      return <div style={textStyle(element)}>{resolveElementText(element, data)}</div>;
  }
};

// Absolutely-positioned element on the final card (mm coordinates, same
// technique as the legacy layout).
const TemplateElement = ({ element, data }) => (
  <div
    style={{
      position: 'absolute',
      left: `${element.x}mm`,
      top: `${element.y}mm`,
      width: `${element.w}mm`,
      height: `${element.h}mm`,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      overflow: 'visible',
    }}
  >
    <ElementContent element={element} data={data} />
  </div>
);

// The card at natural size (mm). Wrap in `transform: scale()` to zoom — the
// markup stays identical, which is what guarantees designer/export parity.
const TemplateCardRenderer = forwardRef(({ template, data }, ref) => {
  const widthMm = Number(template.width_mm) || CARD_WIDTH_MM;
  const heightMm = Number(template.height_mm) || CARD_HEIGHT_MM;
  const elements = (template.layout_json && template.layout_json.elements) || [];
  return (
    <div
      ref={ref}
      className="card-container"
      style={{
        position: 'relative',
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        backgroundImage: template.background_url ? `url(${template.background_url})` : undefined,
        backgroundColor: template.background_url ? undefined : '#f5f5f5',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {elements.map((element) => (
        <TemplateElement key={element.id} element={element} data={data} />
      ))}
    </div>
  );
});

TemplateCardRenderer.displayName = 'TemplateCardRenderer';

export default TemplateCardRenderer;
