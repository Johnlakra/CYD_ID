import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import DioceseRegistration from "./pages/platform/DioceseRegistration";
import { clearPermissionsCache } from "./utils/usePermissions";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [user, setUser] = useState(null);
  // Pre-login view: 'login' | 'register-diocese' (multi-diocese platform).
  const [authView, setAuthView] = useState('login');

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setAuthToken(token);
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (token, userData) => {
    clearPermissionsCache();
    setAuthToken(token);
    setUser(userData);
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    clearPermissionsCache();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthToken('');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <>
      {!isLoggedIn ? (
        authView === 'register-diocese' ? (
          <DioceseRegistration onBackToLogin={() => setAuthView('login')} />
        ) : (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onRegisterDiocese={() => setAuthView('register-diocese')}
          />
        )
      ) : (
        <Dashboard 
          authToken={authToken} 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;