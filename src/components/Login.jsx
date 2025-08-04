import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Card, CardContent } from '@mui/material';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Login successful!');
        onLoginSuccess(token, user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="username"
        label="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ py: 1.5 }}
      >
        {loading ? 'Logging in...' : 'Sign in'}
      </Button>
    </Box>
  );

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
        }
      }}
    >
      <Card
        sx={{
          borderRadius:4,
          maxWidth: 420,
          width: '100%',
          boxShadow: (theme) => theme.shadows[24],
          backgroundColor: 'background.paper',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              gap: 1.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 5,
            }}
          >
            <Typography variant="h5" component="h1">
              Sign in
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              Welcome back! Please sign in to your account
            </Typography>
          </Box>
          
          {renderForm}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;