// Excel bulk import wizard (Platform Phase 2, S6).
// 3 steps: Upload -> Map columns -> Validate & commit. Used for youth profiles
// AND org structure (deanery/parish pairs). Files travel as raw base64 .xlsx
// (backend parses with exceljs; the mock layer reads CSV). Also embedded in
// the setup wizard via the fixedType/embedded props.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  CloudUploadOutlined as UploadIcon,
  DownloadOutlined as DownloadIcon,
  CheckCircleOutline as DoneIcon,
  ErrorOutline as ErrorIcon,
  HistoryOutlined as HistoryIcon,
  RestartAltOutlined as RestartIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import {
  getImportTemplate,
  parseImport,
  validateYouthImport,
  commitYouthImport,
  commitOrgImport,
  listImportJobs,
} from '../../api/platformApi';
import {
  fileToBase64,
  downloadBase64File,
  IMPORT_TYPES,
  IMPORT_STEPS,
} from '../../utils/platformHelpers';

// Display catalog (labels/required mirror the backend column catalog).
const TARGET_COLUMNS = {
  youth: [
    { key: 'name', label: 'Name', required: true },
    { key: 'father', label: 'Father', required: false },
    { key: 'mother', label: 'Mother', required: false },
    { key: 'dob', label: 'DOB', required: true },
    { key: 'date_of_baptism', label: 'Date of Baptism', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'postal_address', label: 'Postal Address', required: false },
    { key: 'deanery', label: 'Deanery', required: true },
    { key: 'parish', label: 'Parish', required: true },
    { key: 'qualification', label: 'Qualification', required: false },
    { key: 'designation', label: 'Designation', required: false },
    { key: 'level', label: 'Level', required: false },
    { key: 'involvement', label: 'Involvement', required: false },
    { key: 'photo_url', label: 'Photo URL', required: false },
  ],
  org: [
    { key: 'deanery', label: 'Deanery', required: true },
    { key: 'parish', label: 'Parish', required: true },
  ],
};

const PREVIEW_COLUMNS = {
  youth: ['name', 'dob', 'phone', 'deanery', 'parish'],
  org: ['deanery', 'parish'],
};

const ImportWizard = ({ onLogout, embedded = false, fixedType = null, onComplete }) => {
  const [type, setType] = useState(fixedType || 'youth');
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null); // { name, base64 }
  const [parsing, setParsing] = useState(false);
  const [parseData, setParseData] = useState(null); // parse endpoint response data
  const [mapping, setMapping] = useState({}); // columnKey -> header index
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null); // youth dry-run response data
  const [autoCreateUsers, setAutoCreateUsers] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null); // commit response data
  const [jobs, setJobs] = useState([]);
  const [showJobs, setShowJobs] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  const columns = TARGET_COLUMNS[type];

  const fetchJobs = useCallback(async () => {
    const res = await listImportJobs();
    if (res.success) setJobs(res.data.jobs || []);
    else if (res.status === 401 && onLogout) onLogout();
  }, [onLogout]);

  useEffect(() => {
    if (!embedded) fetchJobs();
  }, [embedded, fetchJobs]);

  const resetWizard = (nextType = type) => {
    setType(nextType);
    setActiveStep(0);
    setFile(null);
    setParseData(null);
    setMapping({});
    setValidation(null);
    setAutoCreateUsers(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTemplateDownload = async () => {
    setDownloadingTemplate(true);
    const res = await getImportTemplate(type);
    setDownloadingTemplate(false);
    if (res.success) {
      const isCsv = String(res.data.file_name).toLowerCase().endsWith('.csv');
      downloadBase64File(
        res.data.file_base64,
        res.data.file_name,
        isCsv ? 'text/csv' : undefined
      );
    } else {
      toast.error(res.message || 'Template download failed');
    }
  };

  const handleFileChosen = async (e) => {
    const chosen = e.target.files && e.target.files[0];
    if (!chosen) return;

    setParsing(true);
    try {
      const base64 = await fileToBase64(chosen);
      const res = await parseImport({ type, file_base64: base64 });
      setParsing(false);
      if (!res.success) {
        toast.error(res.message || 'Could not parse file');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile({ name: chosen.name, base64 });
      setParseData(res.data);
      setMapping(res.data.suggested_mapping || {});
      setValidation(null);
      setResult(null);
      setActiveStep(1);
    } catch (err) {
      setParsing(false);
      toast.error('Could not read the selected file');
    }
  };

  const missingRequired = columns.filter(
    (c) => c.required && (mapping[c.key] === undefined || mapping[c.key] === null || mapping[c.key] === '')
  );

  const handleMappingNext = async () => {
    if (missingRequired.length) return;
    setActiveStep(2);
    if (type === 'youth') {
      setValidating(true);
      const res = await validateYouthImport({ file_base64: file.base64, mapping });
      setValidating(false);
      if (res.success) setValidation(res.data);
      else toast.error(res.message || 'Validation failed');
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    const body = { file_base64: file.base64, file_name: file.name, mapping };
    const res =
      type === 'youth'
        ? await commitYouthImport({ ...body, options: { auto_create_users: autoCreateUsers } })
        : await commitOrgImport(body);
    setCommitting(false);

    if (res.success) {
      setResult(res.data);
      toast.success(res.message || 'Import complete');
      fetchJobs();
      if (onComplete) onComplete(res.data);
    } else {
      toast.error(res.message || 'Import failed');
    }
  };

  const headerOptions = (parseData && parseData.headers) || [];

  const renderUploadStep = () => (
    <Box>
      {!fixedType && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type}
          onChange={(_, v) => v && resetWizard(v)}
          sx={{ mb: 2 }}
        >
          {Object.entries(IMPORT_TYPES).map(([key, meta]) => (
            <ToggleButton key={key} value={key} sx={{ textTransform: 'none', px: 2.5 }}>
              {meta.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {IMPORT_TYPES[type].description}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={handleTemplateDownload}
          disabled={downloadingTemplate}
          startIcon={
            downloadingTemplate ? <CircularProgress size={16} /> : <DownloadIcon />
          }
        >
          Download template
        </Button>
        <Button
          variant="contained"
          component="label"
          disabled={parsing}
          startIcon={parsing ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
        >
          {parsing ? 'Reading file…' : 'Upload .xlsx'}
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChosen}
          />
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Maximum 2,000 rows per file. Larger lists should be split into multiple files.
      </Typography>
    </Box>
  );

  const renderMappingStep = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        <strong>{file?.name}</strong> — {parseData?.total_rows} rows. Headers were
        auto-matched where possible; adjust below.
      </Alert>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Spreadsheet column</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columns.map((column) => (
              <TableRow key={column.key}>
                <TableCell sx={{ width: '40%' }}>
                  {column.label}
                  {column.required && (
                    <Chip label="required" size="small" color="warning" variant="outlined" sx={{ ml: 1, height: 20 }} />
                  )}
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      label="Column"
                      value={mapping[column.key] ?? ''}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [column.key]: e.target.value === '' ? undefined : e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="">
                        <em>Not in file</em>
                      </MenuItem>
                      {headerOptions.map((header, index) => (
                        <MenuItem key={`${header}-${index}`} value={index}>
                          {header || `Column ${index + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {parseData?.sample_rows?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            First rows of your file
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 220 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {headerOptions.map((header, i) => (
                    <TableCell key={i} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {header || `Column ${i + 1}`}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {parseData.sample_rows.map((row, ri) => (
                  <TableRow key={ri}>
                    {headerOptions.map((_, ci) => (
                      <TableCell key={ci} sx={{ whiteSpace: 'nowrap' }}>
                        {String(row[ci] == null ? '' : row[ci])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {missingRequired.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Map the required fields first:{' '}
          {missingRequired.map((c) => c.label).join(', ')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => resetWizard()}>Start over</Button>
        <Button
          variant="contained"
          disabled={missingRequired.length > 0}
          onClick={handleMappingNext}
        >
          Next: validate
        </Button>
      </Box>
    </Box>
  );

  const renderResult = () => (
    <Box>
      <Alert
        icon={<DoneIcon fontSize="inherit" />}
        severity={result.failed_rows ? 'warning' : 'success'}
        sx={{ mb: 2, borderRadius: 2 }}
      >
        {type === 'youth' ? (
          <>
            Imported <strong>{result.inserted_rows}</strong> of {result.total_rows} rows
            {result.users_created ? (
              <>
                {' '}
                and created <strong>{result.users_created}</strong> login accounts
              </>
            ) : null}
            .
          </>
        ) : (
          <>
            Created <strong>{result.deaneries_created}</strong> deaneries and{' '}
            <strong>{result.parishes_created}</strong> parishes
            {result.skipped_existing ? ` (${result.skipped_existing} already existed)` : ''}.
          </>
        )}
      </Alert>

      {result.credentials?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Created accounts (password = the youth&apos;s phone number)
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 240 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.credentials.map((c) => (
                  <TableRow key={c.row_number}>
                    <TableCell>{c.row_number}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{c.username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {result.failed_rows > 0 && (
        <Alert
          icon={<ErrorIcon fontSize="inherit" />}
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            result.error_file_base64 ? (
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  downloadBase64File(
                    result.error_file_base64,
                    `import_errors_${dayjs().format('YYYYMMDD_hhmmA')}.xlsx`
                  )
                }
              >
                Download errors
              </Button>
            ) : null
          }
        >
          {result.failed_rows} rows failed and were skipped.
        </Alert>
      )}

      <Button variant="outlined" startIcon={<RestartIcon />} onClick={() => resetWizard()}>
        Import another file
      </Button>
    </Box>
  );

  const renderValidateStep = () => {
    if (result) return renderResult();

    if (type === 'org') {
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Ready to import <strong>{parseData?.total_rows}</strong> deanery/parish rows.
            Existing pairs are skipped automatically.
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleCommit}
              disabled={committing}
              startIcon={committing ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {committing ? 'Importing…' : 'Import now'}
            </Button>
          </Box>
        </Box>
      );
    }

    if (validating) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Checking every row against your diocese…
          </Typography>
        </Box>
      );
    }

    if (!validation) {
      return (
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Validation did not complete. Go back and try again.
          </Alert>
          <Button sx={{ mt: 2 }} onClick={() => setActiveStep(1)}>
            Back
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip color="default" label={`${validation.total_rows} total`} />
          <Chip color="success" label={`${validation.valid_rows} valid`} />
          <Chip
            color={validation.invalid_rows ? 'error' : 'default'}
            label={`${validation.invalid_rows} with errors`}
          />
        </Box>

        {validation.errors.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 200 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>Row</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Problems</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validation.errors.map((row) => (
                  <TableRow key={row.row_number}>
                    <TableCell>{row.row_number}</TableCell>
                    <TableCell>{row.errors.join('; ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {validation.preview.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview of valid rows
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 240 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {PREVIEW_COLUMNS[type].map((key) => (
                      <TableCell key={key} sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validation.preview.slice(0, 25).map((row) => (
                    <TableRow key={row.row_number}>
                      {PREVIEW_COLUMNS[type].map((key) => (
                        <TableCell key={key} sx={{ whiteSpace: 'nowrap' }}>
                          {String(row[key] == null ? '' : row[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <FormControlLabel
          sx={{ mb: 2 }}
          control={
            <Checkbox
              checked={autoCreateUsers}
              onChange={(e) => setAutoCreateUsers(e.target.checked)}
            />
          }
          label="Also create login accounts for imported youth (password = their phone number)"
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setActiveStep(1)}>Back</Button>
          <Button
            variant="contained"
            onClick={handleCommit}
            disabled={committing || validation.valid_rows === 0}
            startIcon={committing ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {committing
              ? 'Importing…'
              : `Import ${validation.valid_rows} rows`}
          </Button>
        </Box>
      </Box>
    );
  };

  const stepContent = [renderUploadStep, renderMappingStep, renderValidateStep][activeStep];

  return (
    <Box sx={embedded ? {} : { p: 3 }}>
      {!embedded && (
        <>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
            Bulk Import
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Load youth profiles or your org structure from a spreadsheet
          </Typography>
        </>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {IMPORT_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {stepContent()}
        </CardContent>
      </Card>

      {!embedded && (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Button
              startIcon={<HistoryIcon />}
              onClick={() => setShowJobs((v) => !v)}
              sx={{ textTransform: 'none' }}
            >
              Import history ({jobs.length})
            </Button>
            <Collapse in={showJobs}>
              <Divider sx={{ my: 2 }} />
              {jobs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No imports yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['When', 'Type', 'File', 'Rows', 'Inserted', 'Failed', 'Accounts'].map(
                          (h) => (
                            <TableCell key={h} sx={{ fontWeight: 600 }}>
                              {h}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id} hover>
                          <TableCell>
                            {dayjs(job.created_at).format('DD/MM/YYYY h:mm A')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={IMPORT_TYPES[job.type]?.label || job.type}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{job.file_name || '-'}</TableCell>
                          <TableCell>{job.total_rows}</TableCell>
                          <TableCell>{job.inserted_rows}</TableCell>
                          <TableCell>{job.failed_rows}</TableCell>
                          <TableCell>{job.users_created || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ImportWizard;
