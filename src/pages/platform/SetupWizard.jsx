// First-login setup wizard for a newly approved diocese (Platform Phase 1, S3).
// Steps: org structure (CRUD or spreadsheet import) -> ID card design -> invite
// roles -> done. Progress is kept client-side per diocese (no setup-state
// endpoint yet); the wizard auto-opens while the diocese has no org structure.

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Step,
  StepLabel,
  Stepper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AccountTreeOutlined as TreeIcon,
  BadgeOutlined as BadgeIcon,
  GroupAddOutlined as InviteIcon,
  CelebrationOutlined as DoneIcon,
} from '@mui/icons-material';
import OrgStructureManager from './OrgStructureManager';
import ImportWizard from './ImportWizard';
import { getSetupProgress, saveSetupProgress } from '../../utils/platformHelpers';

const STEPS = ['Deaneries & parishes', 'ID card design', 'Invite your team', 'Done'];

const SetupWizard = ({ user, onLogout, onFinished }) => {
  const dioceseId = user?.diocese_id;
  const [activeStep, setActiveStep] = useState(() => {
    const progress = getSetupProgress(dioceseId);
    return Math.min(progress.step || 0, STEPS.length - 1);
  });
  const [orgMode, setOrgMode] = useState('manual'); // manual | import
  const [structureCount, setStructureCount] = useState(0);

  const goToStep = (step) => {
    setActiveStep(step);
    saveSetupProgress(dioceseId, { completed: step >= STEPS.length - 1, step });
  };

  const handleFinish = () => {
    saveSetupProgress(dioceseId, { completed: true, step: STEPS.length - 1 });
    if (onFinished) onFinished();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        Welcome to CYD
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Let&apos;s set up your diocese — you can revisit any step later from the sidebar
      </Typography>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {activeStep === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <TreeIcon color="primary" />
            <Typography variant="h6">Add your deaneries and parishes</Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={orgMode}
            onChange={(_, v) => v && setOrgMode(v)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="manual" sx={{ textTransform: 'none', px: 2.5 }}>
              Add manually
            </ToggleButton>
            <ToggleButton value="import" sx={{ textTransform: 'none', px: 2.5 }}>
              Import from spreadsheet
            </ToggleButton>
          </ToggleButtonGroup>

          {orgMode === 'manual' ? (
            <OrgStructureManager
              embedded
              onLogout={onLogout}
              onStructureChange={(deaneries) => setStructureCount(deaneries.length)}
            />
          ) : (
            <ImportWizard
              embedded
              fixedType="org"
              onLogout={onLogout}
              onComplete={() => setStructureCount((n) => n + 1)}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => goToStep(1)}>
              {structureCount > 0 ? 'Next' : 'Skip for now'}
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <BadgeIcon color="primary" />
              <Typography variant="h6">Design your ID card</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Every diocese gets its own ID card design — upload a background, place
              the photo, name and details, or start from a ready-made template.
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              The visual card designer arrives with the next platform update. Until
              then your youth profiles are fully usable and cards can be designed
              later without re-entering any data.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => goToStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => goToStep(2)}>
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <InviteIcon color="primary" />
              <Typography variant="h6">Invite your team</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Youth imported with &quot;create login accounts&quot; can sign in right away
              (username shown after import, password = their phone number). Additional
              roles and fine-grained permissions are granted from the admin console.
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              The role &amp; permission matrix arrives with the next platform update.
              Your admin account already has full access to everything in your diocese.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => goToStep(1)}>Back</Button>
              <Button variant="contained" onClick={() => goToStep(3)}>
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <DoneIcon color="success" sx={{ fontSize: 56, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Your diocese is ready
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create ID cards, manage profiles and import youth from the sidebar.
              You can return to Organisation and Bulk Import at any time.
            </Typography>
            <Button variant="contained" size="large" onClick={handleFinish}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SetupWizard;
