import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bec6e0',
      dark: '#0f172a',
      light: '#dae2fd',
      contrastText: '#283044',
    },
    secondary: {
      main: '#ffb690',
      dark: '#ec6a06',
      light: '#ffdbca',
      contrastText: '#552100',
    },
    background: {
      default: '#051424',
      paper: '#122131',
    },
    text: {
      primary: '#d4e4fa',
      secondary: '#c6c6cd',
      disabled: '#45464d',
    },
    divider: 'rgba(69, 70, 77, 0.3)',
    error: {
      main: '#ffb4ab',
    },
    warning: {
      main: '#ffb690',
    },
    success: {
      main: '#4ade80',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
