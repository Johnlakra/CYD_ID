import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Link,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  List as ListIcon,
  Event as EventIcon,
  PictureAsPdf as PdfIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import { PLACES, PLACE_META, placeChipProps, FEE_PER_YOUTH } from '../utils/anubhavHelpers';
import { getRegistrations } from '../api/anubhavApi';
import RegisterYouth from './RegisterYouth';
import RegisteredYouthList from './RegisteredYouthList';

// Public marketing/info website. Override per-environment via
// REACT_APP_ANUBHAV_WEB_URL. TODO: confirm the final deployed domain.
const ANUBHAV_WEB_URL =
  process.env.REACT_APP_ANUBHAV_WEB_URL || 'https://anubhav.diocesseofjalandhar.in';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`anubhav-tabpanel-${index}`}
      aria-labelledby={`anubhav-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `anubhav-tab-${index}`,
    'aria-controls': `anubhav-tabpanel-${index}`,
  };
}

const AnubhavRegistration = ({ eventRole, locPlace, onLogout }) => {
  const isLoc = eventRole === 'loc';

  // LOC: place is fixed. DEXCO: defaults to first place, user can change.
  const [selectedPlace, setSelectedPlace] = useState(
    isLoc ? locPlace : PLACES[0]
  );
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePlace = isLoc ? locPlace : selectedPlace;
  const [reportGenerating, setReportGenerating] = useState(false);
  const [includePhones, setIncludePhones] = useState(false);

  const handleRegistered = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const generateFullDioceseReport = async () => {
    setReportGenerating(true);
    try {
      const allResults = await Promise.all(
        PLACES.map((pl) => getRegistrations({ place: pl }))
      );

      const placeData = PLACES.map((pl, i) => ({
        place: pl,
        meta: PLACE_META[pl],
        regs: allResults[i].success && Array.isArray(allResults[i].data?.registrations)
          ? allResults[i].data.registrations
          : [],
      }));

      const grandTotal = placeData.reduce((s, pd) => s + pd.regs.length, 0);
      if (!grandTotal) { toast.info('No registrations to export'); return; }

      const gen = (() => {
        const d = new Date(), z = (n) => String(n).padStart(2, '0');
        return `${z(d.getDate())}/${z(d.getMonth()+1)}/${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`;
      })();

      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const PW = 297, PH = 210, M = 8;
      const CW = PW - M * 2;
      const COLS = includePhones
        ? [8, 64, 54, 52, 40, 30, 33]
        : [8, 78, 60, 58, 44, 33];
      const LABELS = includePhones
        ? ['#', 'Name', "Father's Name", 'Parish', 'Deanery', 'Phone', 'Chaperone']
        : ['#', 'Name', "Father's Name", 'Parish', 'Deanery', 'Chaperone'];
      const ROW_H = 7, HEAD_H = 8;
      const FOOTER_Y = PH - M - 10;
      const GREY = [245, 245, 245], HGREY = [220, 220, 220];

      const trunc = (t, n) => { const s = t ? String(t) : '—'; return s.length > n ? s.slice(0,n-1)+'…' : s; };
      let curY = 0, pageNum = 1;

      const drawFooter = () => {
        doc.setFont('helvetica','italic').setFontSize(8);
        doc.text(`Page ${pageNum}`, M, PH-M+4);
        doc.text(`Generated: ${gen}`, PW-M, PH-M+4, { align: 'right' });
      };
      const drawPlaceHeader = (pm, subTitle, regsCount) => {
        doc.setFont('helvetica','bold').setFontSize(11);
        doc.text(`Anubhav Retreat 2026 — ${pm.label} | ${pm.venue} | ${pm.dates}`, M, M);
        doc.setFont('helvetica','normal').setFontSize(9);
        doc.text(`${subTitle}  ·  ${regsCount} registrations`, M, M+5);
        doc.setDrawColor(180,180,180).line(M, M+8, PW-M, M+8);
        curY = M + 13;
        doc.setFillColor(...HGREY).rect(M, curY, CW, HEAD_H, 'F');
        doc.setFont('helvetica','bold').setFontSize(8);
        let x = M + 1;
        LABELS.forEach((l, i) => { doc.text(l, x, curY+5.5); x += COLS[i]; });
        curY += HEAD_H;
      };
      const ensureRow = (pm, subTitle, regsCount) => {
        if (curY + ROW_H > FOOTER_Y) {
          drawFooter(); doc.addPage(); pageNum++;
          drawPlaceHeader(pm, subTitle, regsCount);
        }
      };

      // Per-place sections
      placeData.forEach((pd, pIdx) => {
        if (pIdx > 0) { drawFooter(); doc.addPage(); pageNum++; }
        drawPlaceHeader(pd.meta, 'Participant List', pd.regs.length);

        const grouped = {};
        pd.regs.forEach(r => { (grouped[r.deanery] = grouped[r.deanery] || []).push(r); });
        let serial = 1;

        Object.keys(grouped).sort().forEach(dn => {
          if (curY + 6 > FOOTER_Y) { drawFooter(); doc.addPage(); pageNum++; drawPlaceHeader(pd.meta, 'Participant List (cont.)', pd.regs.length); }
          doc.setFont('helvetica','bold').setFontSize(8).setTextColor(80,80,80);
          doc.text(dn, M+1, curY+5); doc.setTextColor(0,0,0); curY += 6;

          grouped[dn].forEach((row, idx) => {
            ensureRow(pd.meta, 'Participant List (cont.)', pd.regs.length);
            if (idx % 2 === 1) doc.setFillColor(...GREY).rect(M, curY, CW, ROW_H, 'F');
            doc.setFont('helvetica','normal').setFontSize(8);
            const chap = row.chaperone_name
              ? `${row.chaperone_name}${includePhones && row.chaperone_phone ? ' ' + row.chaperone_phone : ''}`
              : '—';
            const vals = includePhones
              ? [String(serial++), trunc(row.name,38), trunc(row.father_name,32), trunc(row.parish,30), trunc(row.deanery,24), trunc(row.phone,16), trunc(chap,20)]
              : [String(serial++), trunc(row.name,46), trunc(row.father_name,36), trunc(row.parish,34), trunc(row.deanery,26), trunc(chap,20)];
            let x = M + 1;
            vals.forEach((v, i) => { doc.text(v, x, curY+5); x += COLS[i]; });
            curY += ROW_H;
          });
          curY += 2;
        });
      });

      // Summary page
      drawFooter(); doc.addPage(); pageNum++;
      doc.setFont('helvetica','bold').setFontSize(13);
      doc.text('Anubhav Retreat 2026 — Diocese Summary', M, M);
      doc.setFont('helvetica','normal').setFontSize(9);
      doc.text(`All three venues  ·  ${grandTotal} total registrations`, M, M+6);
      doc.setDrawColor(180,180,180).line(M, M+9, PW-M, M+9);
      curY = M + 16;

      const SCOLS = [110, 70, 50, 51];
      const SLABELS = ['Venue', 'Dates', 'Youth', 'Fees Collected'];
      doc.setFillColor(...HGREY).rect(M, curY, CW, HEAD_H, 'F');
      doc.setFont('helvetica','bold').setFontSize(9);
      let sx = M + 2;
      SLABELS.forEach((l, i) => { doc.text(l, sx, curY+5.5); sx += SCOLS[i]; });
      curY += HEAD_H;

      placeData.forEach((pd, idx) => {
        if (idx % 2 === 1) doc.setFillColor(...GREY).rect(M, curY, CW, ROW_H+1, 'F');
        doc.setFont('helvetica','normal').setFontSize(9);
        const vals = [pd.meta.venue, pd.meta.dates, String(pd.regs.length), `Rs.${pd.regs.reduce((s,r)=>s+(r.fee_amount||FEE_PER_YOUTH),0)}`];
        let x = M + 2;
        vals.forEach((v, i) => { doc.text(v, x, curY+5.5); x += SCOLS[i]; });
        curY += ROW_H + 1;
      });

      curY += 4;
      doc.setFont('helvetica','bold').setFontSize(10);
      doc.text(`Grand Total:  ${grandTotal} youth  ·  Rs.${placeData.reduce((s,pd)=>s+pd.regs.reduce((ss,r)=>ss+(r.fee_amount||FEE_PER_YOUTH),0),0)}`, M, curY);

      // Patch all page footers
      const total = doc.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFont('helvetica','italic').setFontSize(8);
        doc.text(`Page ${p} of ${total}`, M, PH-M+4);
        doc.text(`Generated: ${gen}`, PW-M, PH-M+4, { align: 'right' });
        doc.setFont('helvetica','normal').setFontSize(7).setTextColor(140,140,140);
        doc.text(
          'Powered by — Softech Smart Solutions · In collaboration with Youth Commission, Diocese of Jalandhar',
          PW / 2, PH - M + 8, { align: 'center' }
        );
        doc.setTextColor(0,0,0);
      }

      doc.save('anubhav-full-diocese-report-2026.pdf');
      toast.success('Full diocese report downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setReportGenerating(false);
    }
  };

  const chipProps = placeChipProps(activePlace);
  const meta = PLACE_META[activePlace];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <EventIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Anubhav Retreat 2026
          </Typography>
          <Chip {...chipProps} size="small" />
          {meta && (
            <Typography variant="body2" color="text.secondary">
              {meta.venue} &nbsp;|&nbsp; {meta.dates}
            </Typography>
          )}
          <Link
            href={ANUBHAV_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            underline="hover"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            View public website
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </Link>
        </Box>
        {!isLoc && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Off by default — youth contact numbers stay private.">
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={includePhones}
                    onChange={(e) => setIncludePhones(e.target.checked)}
                  />
                }
                label="Include phone numbers"
                sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
              />
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={reportGenerating ? <CircularProgress size={16} /> : <PdfIcon />}
              onClick={generateFullDioceseReport}
              disabled={reportGenerating}
            >
              {reportGenerating ? 'Generating…' : 'Full Diocese Report'}
            </Button>
          </Box>
        )}
      </Box>

      {!isLoc && (
        <Box sx={{ mb: 3, maxWidth: 280 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Place</InputLabel>
            <Select
              value={selectedPlace}
              label="Place"
              onChange={(e) => setSelectedPlace(e.target.value)}
            >
              {PLACES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PLACE_META[p].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            aria-label="Anubhav registration tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<PersonAddIcon />}
              iconPosition="start"
              label="Register Youth"
              {...a11yProps(0)}
            />
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="Registered Youth"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <RegisterYouth
            activePlace={activePlace}
            onLogout={onLogout}
            onRegistered={handleRegistered}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <RegisteredYouthList
            activePlace={activePlace}
            onLogout={onLogout}
            refreshKey={refreshKey}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnubhavRegistration;
