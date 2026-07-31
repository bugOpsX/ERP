import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Divider,
  IconButton,
  CircularProgress,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

/**
 * DownloadDialog
 * A professional Material UI dialog giving the user options for bulk downloading attendance cards.
 * Automatically adapts dynamically to any number of available Blast Furnace units.
 */
const DownloadDialog = ({
  open,
  onClose,
  currentSite = 'All',
  availableSites = [],
  onDownload,
  isGenerating = false
}) => {
  const [downloadOption, setDownloadOption] = useState('current');

  const handleDownloadClick = () => {
    onDownload({ mode: downloadOption });
  };

  const handleIndividualSiteClick = (site) => {
    onDownload({ mode: 'individual', site });
  };

  // Filter out any empty/null sites and sort them
  const sitesList = availableSites
    .filter(Boolean)
    .filter(site => site !== 'All')
    .sort();

  return (
    <Dialog
      open={open}
      onClose={isGenerating ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            backgroundColor: '#0d1c2d',
            color: '#d4e4fa',
            border: '1px solid #45464d/30',
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)'
          }
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(69, 70, 77, 0.2)',
          backgroundColor: '#051424'
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 700, color: '#d4e4fa', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined text-[#ffb690] text-[22px]">download_for_offline</span>
          Download Attendance Cards
        </Typography>
        {!isGenerating && (
          <IconButton
            aria-label="close download dialog"
            onClick={onClose}
            sx={{ color: '#909097', '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' } }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 3, backgroundColor: '#0d1c2d' }}>
        {isGenerating ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
            <CircularProgress size={40} sx={{ color: '#ffb690' }} />
            <Typography variant="body2" sx={{ color: '#909097', fontWeight: 600, textTransform: 'uppercase', tracking: 1 }}>
              Generating PDFs, please wait...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Primary Download Option Selector */}
            <RadioGroup
              value={downloadOption}
              onChange={(e) => setDownloadOption(e.target.value)}
              sx={{ gap: 1.5, mb: 3 }}
            >
              <FormControlLabel
                value="current"
                control={<Radio sx={{ color: '#909097', '&.Mui-checked': { color: '#ffb690' } }} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#d4e4fa' }}>
                      Current Site Only ({currentSite === 'All' ? 'All Units' : currentSite})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#909097' }}>
                      Downloads attendance cards for {currentSite === 'All' ? 'all' : currentSite} workers in a single file.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="separate"
                control={<Radio sx={{ color: '#909097', '&.Mui-checked': { color: '#ffb690' } }} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#d4e4fa' }}>
                      Download Each Site Separately
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#909097' }}>
                      Generates one separate PDF for each active Blast Furnace unit.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {/* Divider */}
            <Divider sx={{ my: 2.5, borderColor: 'rgba(69, 70, 77, 0.2)' }} />

            {/* Individual Sites Option */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#ffb690', textTransform: 'uppercase', tracking: 1, mb: 1.5 }}>
                Or Download Individual Site
              </Typography>
              
              {sitesList.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#909097', fontStyle: 'italic' }}>
                  No active units found.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  {sitesList.map((site) => (
                    <Button
                      key={site}
                      variant="outlined"
                      size="small"
                      onClick={() => handleIndividualSiteClick(site)}
                      sx={{
                        color: '#d4e4fa',
                        borderColor: 'rgba(69, 70, 77, 0.4)',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1.5,
                        backgroundColor: 'rgba(28, 43, 60, 0.3)',
                        '&:hover': {
                          borderColor: '#ffb690',
                          color: '#ffb690',
                          backgroundColor: 'rgba(255, 182, 144, 0.05)'
                        }
                      }}
                    >
                      🏭 {site}
                    </Button>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      {!isGenerating && (
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: '1px solid rgba(69, 70, 77, 0.2)',
            backgroundColor: '#051424',
            gap: 1.5
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: '#909097',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: 1,
              '&:hover': { color: '#ffffff' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDownloadClick}
            startIcon={<FileDownloadIcon />}
            sx={{
              backgroundColor: '#ffb690',
              color: '#552100',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: 1,
              px: 3.5,
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: '#ffc6a8'
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DownloadDialog;
