// Public diocese self-registration (Platform Phase 1, S1).
// Reached from the "Register your diocese" link on the login screen.
// Submits to POST /platform/dioceses/register and lands in a pending state
// until a super_admin approves it from the Diocese Approvals console.

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import { registerDiocese } from '../../api/platformApi';
import { slugify, isValidSlug } from '../../utils/platformHelpers';

const EMPTY_FORM = {
  name: '',
  slug: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  logo_url: '',
};

const DioceseRegistration = ({ onBackToLogin }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { name, slug } after success

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Slug follows the name until the user edits the slug directly.
      if (field === 'name' && !slugTouched) {
        next.slug = slugify(value);
      }
      if (field === 'slug') {
        setSlugTouched(true);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 3) {
      next.name = 'Diocese name must be at least 3 characters';
    }
    if (form.slug && !isValidSlug(form.slug)) {
      next.slug = 'Lowercase letters, numbers and hyphens only (min 2 characters)';
    }
    if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      next.contact_email = 'A valid contact email is required';
    }
    if (!/^[0-9+\-\s]{7,30}$/.test(form.contact_phone.trim())) {
      next.contact_phone = 'A valid contact phone is required (7-30 digits)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const body = {
      name: form.name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim(),
    };
    if (form.slug.trim()) body.slug = form.slug.trim();
    if (form.address.trim()) body.address = form.address.trim();
    if (form.logo_url.trim()) body.logo_url = form.logo_url.trim();

    const res = await registerDiocese(body);
    setSubmitting(false);

    if (res.success) {
      setSubmitted({ name: res.data.name, slug: res.data.slug });
    } else if (res.status === 409) {
      setErrors((prev) => ({ ...prev, slug: res.message }));
    } else {
      toast.error(res.message || 'Registration failed');
    }
  };

  const fieldSx = {
    mb: 2.5,
    '& .MuiOutlinedInput-root': { borderRadius: 2 },
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        '&::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/background/overlay.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.24,
          zIndex: -1,
        },
      }}
    >
      <Card
        sx={{
          borderRadius: 4,
          maxWidth: 520,
          width: '100%',
          boxShadow: (theme) => theme.shadows[24],
          backgroundColor: 'background.paper',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {submitted ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Registration submitted
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <strong>{submitted.name}</strong> is awaiting platform approval.
                Once approved, an administrator account
                (<strong>{submitted.slug}.admin</strong>) will be created and you can
                sign in using your registered contact phone as the password.
              </Typography>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={onBackToLogin}
              >
                Back to sign in
              </Button>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  gap: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
                }}
              >
                <Typography variant="h5" component="h1">
                  Register your diocese
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', textAlign: 'center' }}
                >
                  Bring your diocese onto the CYD platform. A platform administrator
                  reviews every registration before it goes live.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  required
                  label="Diocese name"
                  value={form.name}
                  onChange={handleChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="URL slug"
                  value={form.slug}
                  onChange={handleChange('slug')}
                  error={!!errors.slug}
                  helperText={
                    errors.slug ||
                    'Short identifier used in usernames and QR codes, e.g. jalandhar'
                  }
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Contact email"
                  value={form.contact_email}
                  onChange={handleChange('contact_email')}
                  error={!!errors.contact_email}
                  helperText={errors.contact_email}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  required
                  label="Contact phone"
                  value={form.contact_phone}
                  onChange={handleChange('contact_phone')}
                  error={!!errors.contact_phone}
                  helperText={
                    errors.contact_phone ||
                    'Becomes the first admin password after approval'
                  }
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Address"
                  value={form.address}
                  onChange={handleChange('address')}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Logo URL (optional)"
                  value={form.logo_url}
                  onChange={handleChange('logo_url')}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />

                <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                  After approval you will sign in as{' '}
                  <strong>{form.slug || 'your-slug'}.admin</strong> and a setup wizard
                  will walk you through deaneries, parishes and youth import.
                </Alert>

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  color="inherit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={
                    submitting ? <CircularProgress size={20} color="inherit" /> : null
                  }
                  sx={{ py: 1.5 }}
                >
                  {submitting ? 'Submitting...' : 'Submit registration'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={onBackToLogin}
                    sx={{ color: 'text.secondary' }}
                  >
                    Back to sign in
                  </Link>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DioceseRegistration;
