import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';

import AttendanceCard from './AttendanceCard';
import { downloadAttendancePDF, printAttendanceCard } from '../utils/pdfGenerator';

const WorkerDetailModal = ({ open, onClose, worker }) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!worker) return null;

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadAttendancePDF(worker);
    } catch (err) {
      console.error('[WorkerDetailModal] PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    printAttendanceCard(worker);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2, maxHeight: '92vh' },
        },
      }}
    >
      {/* ── Title Bar ── */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          flexShrink: 0,
        }}
      >
        <Typography component="span" variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
          Worker Attendance Details
        </Typography>
        <IconButton
          aria-label="close modal"
          onClick={onClose}
          sx={{ color: '#ffffff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ── Card Content ── */}
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: '#f0f4f8',
          overflowY: 'auto',
        }}
      >
        <AttendanceCard worker={worker} />
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Button
          variant="text"
          color="inherit"
          onClick={onClose}
          sx={{ mr: 'auto', color: 'text.secondary' }}
        >
          Close
        </Button>

        <Tooltip title="Print attendance card">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 600, borderRadius: 1.5 }}
          >
            Print
          </Button>
        </Tooltip>

        <Tooltip title={`Save as ${worker.Name}_${worker.WISA}_Attendance.pdf`}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            sx={{ fontWeight: 700, borderRadius: 1.5, minWidth: 160 }}
          >
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default WorkerDetailModal;
