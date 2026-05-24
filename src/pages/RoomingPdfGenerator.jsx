import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardHeader, CardContent, Typography, Button,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Stack, Alert,
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { getRooming } from '../api/anubhavApi';
import { PLACE_META } from '../utils/anubhavHelpers';

// ── constants ─────────────────────────────────────────────────────────────────
const PAGE_W = 297, PAGE_H = 210, MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COL_WIDTHS = [55, 45, 38, 38, 30];
const COL_LABELS = ['Name', "Father's Name", 'Parish', 'Deanery', 'Phone'];
const ROW_H = 7, HEADER_H = 8;
const GREY_FILL = [245, 245, 245], HEADER_FILL = [220, 220, 220];

// ── helpers ───────────────────────────────────────────────────────────────────
const safeArray = (v) => (Array.isArray(v) ? v : []);
const trunc = (t, n) => { const s = t ? String(t) : ''; return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const nowLabel = () => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const handleAuthError = (env, onLogout) => {
  if (env && env.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.'); onLogout(); return true;
  }
  return false;
};

// ── PDF primitives ────────────────────────────────────────────────────────────
const pageHeader = (doc, meta, sub, ref) => {
  doc.setFont('helvetica', 'bold').setFontSize(10);
  doc.text(`Anubhav Retreat 2026 — ${meta.label} | ${meta.venue} | ${meta.dates}`, MARGIN, MARGIN);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  doc.text(sub, MARGIN, MARGIN + 5);
  doc.setDrawColor(180, 180, 180).line(MARGIN, MARGIN + 8, PAGE_W - MARGIN, MARGIN + 8);
  ref.y = MARGIN + 13;
};
const pageFooter = (doc, num, total, gen) => {
  const y = PAGE_H - MARGIN + 4;
  doc.setFont('helvetica', 'italic').setFontSize(8);
  doc.text(`Page ${num} of ${total}`, MARGIN, y);
  doc.text(`Generated: ${gen}`, PAGE_W - MARGIN, y, { align: 'right' });
};
const tableHeader = (doc, y) => {
  doc.setFillColor(...HEADER_FILL).rect(MARGIN, y, CONTENT_W, HEADER_H, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8);
  let x = MARGIN + 1;
  COL_LABELS.forEach((l, i) => { doc.text(l, x, y + 5.5); x += COL_WIDTHS[i]; });
  return y + HEADER_H;
};
const occupantRow = (doc, occ, idx, y) => {
  if (idx % 2 === 1) { doc.setFillColor(...GREY_FILL).rect(MARGIN, y, CONTENT_W, ROW_H, 'F'); }
  doc.setFont('helvetica', 'normal').setFontSize(8);
  const vals = [trunc(occ.name, 24), trunc(occ.father_name, 20), trunc(occ.parish, 18), trunc(occ.deanery, 17), trunc(occ.phone, 12)];
  let x = MARGIN + 1;
  vals.forEach((v, i) => { doc.text(v, x, y + 5); x += COL_WIDTHS[i]; });
  return y + ROW_H;
};
const FOOTER_Y = PAGE_H - MARGIN - 14;
const ensureSpace = (doc, ref, meta, sub, pages, gen, needed) => {
  if (ref.y + needed > FOOTER_Y && ref.y > MARGIN + 20) {
    pageFooter(doc, pages.length, '?', gen); doc.addPage(); pages.push(1); pageHeader(doc, meta, sub, ref);
  }
};

const roomBlock = (doc, room, bName, fName, ref, meta, gen, pages) => {
  const occs = safeArray(room.occupants);
  ensureSpace(doc, ref, meta, `${bName} → ${fName}`, pages, gen, 14 + HEADER_H + occs.length * ROW_H + 4);
  doc.setFont('helvetica', 'bold').setFontSize(9);
  doc.text(`${room.name}  (${room.occupancy ?? occs.length} / ${room.capacity})`, MARGIN, ref.y);
  ref.y += 5;
  if (!occs.length) {
    doc.setFont('helvetica', 'italic').setFontSize(8).text('No occupants assigned.', MARGIN + 2, ref.y);
    ref.y += 6; return;
  }
  ref.y = tableHeader(doc, ref.y);
  occs.forEach((occ, idx) => {
    if (ref.y + ROW_H > FOOTER_Y) {
      pageFooter(doc, pages.length, '?', gen); doc.addPage(); pages.push(1);
      pageHeader(doc, meta, `${bName} → ${fName} → ${room.name} (cont.)`, ref);
      ref.y = tableHeader(doc, ref.y);
    }
    ref.y = occupantRow(doc, occ, idx, ref.y);
  });
  ref.y += 4;
};
const finalize = (doc, gen) => {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) { doc.setPage(p); pageFooter(doc, p, total, gen); }
};
const mkDoc = () => new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

// ── PDF generators ────────────────────────────────────────────────────────────
const buildRoomPdf = (buildings, roomId, meta, gen) => {
  let room, b, f;
  for (const bd of buildings) for (const fl of safeArray(bd.floors)) for (const r of safeArray(fl.rooms)) {
    if (r.id === roomId) { room = r; b = bd; f = fl; }
  }
  if (!room) return null;
  const doc = mkDoc(), ref = { y: 0 }, pages = [1];
  pageHeader(doc, meta, `${b.name} → ${f.name} → ${room.name}`, ref);
  roomBlock(doc, room, b.name, f.name, ref, meta, gen, pages);
  finalize(doc, gen); return doc;
};

const buildFloorPdf = (buildings, floorId, meta, gen) => {
  let fl, bd;
  for (const b of buildings) for (const f of safeArray(b.floors)) { if (f.id === floorId) { fl = f; bd = b; } }
  if (!fl) return null;
  const doc = mkDoc(), ref = { y: 0 }, pages = [1];
  pageHeader(doc, meta, `${bd.name} → ${fl.name}`, ref);
  for (const room of safeArray(fl.rooms)) roomBlock(doc, room, bd.name, fl.name, ref, meta, gen, pages);
  finalize(doc, gen); return doc;
};

const buildBuildingPdf = (buildings, buildingId, meta, gen) => {
  const bd = buildings.find((b) => b.id === buildingId);
  if (!bd) return null;
  const doc = mkDoc(), ref = { y: 0 }, pages = [1];
  pageHeader(doc, meta, bd.name, ref);
  for (const fl of safeArray(bd.floors)) {
    ensureSpace(doc, ref, meta, bd.name, pages, gen, 10);
    doc.setFont('helvetica', 'bold').setFontSize(10).text(`Floor: ${fl.name}`, MARGIN, ref.y);
    ref.y += 6;
    for (const room of safeArray(fl.rooms)) roomBlock(doc, room, bd.name, fl.name, ref, meta, gen, pages);
  }
  finalize(doc, gen); return doc;
};

const buildFullPlacePdf = (buildings, meta, gen) => {
  const doc = mkDoc(), ref = { y: 0 }, pages = [1];
  pageHeader(doc, meta, 'Full Rooming List', ref);
  for (const bd of buildings) {
    ensureSpace(doc, ref, meta, 'Full Rooming List', pages, gen, 12);
    doc.setFont('helvetica', 'bold').setFontSize(11).text(`Building: ${bd.name}`, MARGIN, ref.y);
    ref.y += 7;
    for (const fl of safeArray(bd.floors)) {
      ensureSpace(doc, ref, meta, `${bd.name} (cont.)`, pages, gen, 10);
      doc.setFont('helvetica', 'bold').setFontSize(9).text(`  Floor: ${fl.name}`, MARGIN, ref.y);
      ref.y += 5;
      for (const room of safeArray(fl.rooms)) roomBlock(doc, room, bd.name, fl.name, ref, meta, gen, pages);
    }
  }
  finalize(doc, gen); return doc;
};

// ── Component ─────────────────────────────────────────────────────────────────
const RoomingPdfGenerator = ({ activePlace, onLogout }) => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selBuildingId, setSelBuildingId] = useState('');
  const [selFloorId, setSelFloorId] = useState('');
  const [selRoomId, setSelRoomId] = useState('');

  const meta = PLACE_META[activePlace] || {};
  const selBuilding = buildings.find((b) => b.id === selBuildingId) || null;
  const floorOptions = safeArray(selBuilding?.floors);
  const selFloor = floorOptions.find((f) => f.id === selFloorId) || null;
  const roomOptions = safeArray(selFloor?.rooms);

  const fetchData = useCallback(async () => {
    if (!activePlace) return;
    setLoading(true);
    const res = await getRooming({ place: activePlace });
    setLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) { toast.error(res.message || 'Failed to load rooming data'); setBuildings([]); return; }
    setBuildings(safeArray(res.data));
    setSelBuildingId(''); setSelFloorId(''); setSelRoomId('');
  }, [activePlace, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBuildingChange = (val) => { setSelBuildingId(val); setSelFloorId(''); setSelRoomId(''); };
  const handleFloorChange = (val) => { setSelFloorId(val); setSelRoomId(''); };

  const run = async (genFn, filename) => {
    setGenerating(true);
    try {
      const gen = nowLabel(), doc = genFn(gen);
      if (!doc) { toast.error('Could not generate PDF — selection not found.'); return; }
      doc.save(filename);
      toast.success(`PDF saved: ${filename}`);
    } catch { toast.error('PDF generation failed. Please try again.'); }
    finally { setGenerating(false); }
  };

  const busy = loading || generating;
  const BtnIcon = ({ gen }) => gen ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />;

  return (
    <Box>
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PdfIcon color="primary" />
              <Typography variant="h6">Generate PDFs</Typography>
            </Box>
            <Button variant="outlined" size="small" startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={fetchData} disabled={busy}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </Box>
        } />
        <CardContent>
          {!loading && buildings.length === 0 ? (
            <Alert severity="info">No rooming data available. Set up buildings and allotments first.</Alert>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Narrow scope (optional)</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Building</InputLabel>
                  <Select value={selBuildingId} label="Building" onChange={(e) => handleBuildingChange(e.target.value)} disabled={busy}>
                    <MenuItem value=""><em>All buildings</em></MenuItem>
                    {buildings.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }} disabled={!selBuildingId || busy}>
                  <InputLabel>Floor</InputLabel>
                  <Select value={selFloorId} label="Floor" onChange={(e) => handleFloorChange(e.target.value)}>
                    <MenuItem value=""><em>All floors</em></MenuItem>
                    {floorOptions.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }} disabled={!selFloorId || busy}>
                  <InputLabel>Room</InputLabel>
                  <Select value={selRoomId} label="Room" onChange={(e) => setSelRoomId(e.target.value)}>
                    <MenuItem value=""><em>All rooms</em></MenuItem>
                    {roomOptions.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Download</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                <Button variant="contained" size="small" startIcon={<BtnIcon gen={generating} />}
                  onClick={() => run((gen) => buildRoomPdf(buildings, selRoomId, meta, gen), `rooming-room-${selRoomId}-${activePlace}.pdf`)}
                  disabled={busy || !selRoomId}>Room Sheet</Button>
                <Button variant="contained" size="small" startIcon={<BtnIcon gen={generating} />}
                  onClick={() => run((gen) => buildFloorPdf(buildings, selFloorId, meta, gen), `rooming-floor-${selFloorId}-${activePlace}.pdf`)}
                  disabled={busy || !selFloorId}>Floor Sheet</Button>
                <Button variant="outlined" size="small" startIcon={<BtnIcon gen={generating} />}
                  onClick={() => run((gen) => buildBuildingPdf(buildings, selBuildingId, meta, gen), `rooming-building-${selBuildingId}-${activePlace}.pdf`)}
                  disabled={busy || !selBuildingId}>Building Sheet</Button>
                <Button variant="outlined" size="small" startIcon={<BtnIcon gen={generating} />}
                  onClick={() => run((gen) => buildFullPlacePdf(buildings, meta, gen), `rooming-full-${activePlace}.pdf`)}
                  disabled={busy}>Full Place Rooming List</Button>
              </Stack>

              {generating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Generating PDF…</Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoomingPdfGenerator;
