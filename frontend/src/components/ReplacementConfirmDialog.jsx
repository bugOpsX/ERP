import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

const ReplacementConfirmDialog = ({ open, onClose, onConfirm, plantName, period, existingImportId, isImporting }) => {
  return (
    <Dialog
      open={open}
      onClose={isImporting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0d1c2d',
          color: '#d4e4fa',
          borderRadius: '16px',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <div className="space-y-4 text-center">
          {/* Warning Icon */}
          <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#d4e4fa] tracking-tight">
              REPLACE ATTENDANCE DATA?
            </h3>
            <p className="text-xs text-[#909097] mt-1">
              Double Confirmation Required
            </p>
          </div>

          {/* Impact Alert Card */}
          <div className="p-4 bg-[#122131] border border-[#45464d]/30 rounded-xl text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097]">Target Location:</span>
              <span className="font-bold text-[#d4e4fa]">{plantName || 'Surat, Gujarat'}</span>
            </div>
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097]">Period:</span>
              <span className="font-bold text-[#ffb690]">{period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#909097]">Active Import:</span>
              <span className="font-mono font-bold text-amber-400">#{existingImportId || 'Current'}</span>
            </div>
          </div>

          <p className="text-xs text-[#909097] leading-relaxed text-left">
            The existing attendance records for this period will be superseded and replaced by the newly validated dataset in a single database transaction. The previous import will remain in Import History as <strong className="text-amber-400">REPLACED</strong>.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 bg-[#273647] text-[#c6c6cd] font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-[#32455b] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isImporting}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Replacing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  <span>Confirm Replacement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReplacementConfirmDialog;
