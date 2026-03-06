import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import RecipePage from './pages/RecipePage';
import AuthenticationPage from './pages/auth/AuthenticationPage';
import BasicAuthenticationPage from './pages/auth/BasicAuthenticationPage';
import BasicAuthenticationSignUpPage from './pages/auth/BasicAuthenticationSignUpPage';
import BasicAuthenticationSignInPage from './pages/auth/BasicAuthenticationSignInPage';
import OAuth2AuthenticationPage from './pages/auth/OAuth2AuthenticationPage';
import OAuth2AuthenticationSignUpPage from './pages/auth/OAuth2AuthenticationSignUpPage';
import OAuth2AuthenticationSignInPage from './pages/auth/OAuth2AuthenticationSignInPage';
import OAuth2CallbackPage from './pages/auth/OAuth2CallbackPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import UserPage from './pages/UserPage';
import AuthenticationProvider from './contexts/AuthenticationContext.tsx';

// Create MUI theme with Apple-style light grey/white palette
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d1d1f', // Apple dark text
      light: '#86868b',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#86868b', // Apple secondary grey
      light: '#d2d2d7',
      dark: '#6e6e73',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff', // Pure white
      paper: '#f5f5f7', // Apple very light grey
    },
    text: {
      primary: '#1d1d1f', // Apple dark text
      secondary: '#86868b', // Apple grey text
    },
    divider: '#d2d2d7', // Apple light divider
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f5f7',
          color: '#1d1d1f',
          boxShadow: 'none',
          borderBottom: '1px solid #d2d2d7',
          borderRadius: 0,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthenticationProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Landing page */}
                <Route path="/" element={<LandingPage />} />

                {/* Recipe page */}
                <Route path="/recipes/:recipeId" element={<RecipePage />} />

                {/* Authentication routes */}
                <Route path="/auth" element={<AuthenticationPage />} />
                <Route path="/auth/basic" element={<BasicAuthenticationPage />} />
                <Route path="/auth/basic/sign-up" element={<BasicAuthenticationSignUpPage />} />
                <Route path="/auth/basic/sign-in" element={<BasicAuthenticationSignInPage />} />
                <Route path="/auth/oauth2" element={<OAuth2AuthenticationPage />} />
                <Route path="/auth/oauth2/sign-up" element={<OAuth2AuthenticationSignUpPage />} />
                <Route path="/auth/oauth2/sign-in" element={<OAuth2AuthenticationSignInPage />} />
                <Route path="/auth/oauth2/callback" element={<OAuth2CallbackPage />} />

                {/* Protected routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:userId"
                  element={
                    <ProtectedRoute>
                      <UserPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </AuthenticationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
