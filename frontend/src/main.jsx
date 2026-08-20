import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { SiteProvider } from './context/SiteContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AttendanceProvider>
          <SiteProvider>
            <App />
          </SiteProvider>
        </AttendanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
