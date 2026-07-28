'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Application } from '@/types';

// Administrator Portal — Applications > "Force close (if authorized)".
// Closing an already-decided (approved/rejected) application is routine
// housekeeping; closing one that hasn't been decided yet is the actual
// override, so a reason is required in that case (matches the backend's
// validation in workflow.service.js#closeApplication).
export default function AdminCloseControl({
  application,
  onUpdated,
}: {
  application: Application;
  onUpdated: (application: Application) => void;
}) {
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const isDecided = application.status === 'APPROVED' || application.status === 'REJECTED';

  const handleClose = async () => {
    if (!isDecided && !remarks.trim()) {
      setError('Please provide a reason to force-close an application that has not been decided.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.patch(`/applications/${application.id}/close`, { remarks: remarks || undefined });
      onUpdated(res.data.data.application);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to close this application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-slate-300 bg-slate-50 print:hidden">
      <h2 className="mb-1 font-medium text-slate-900">Administrator Controls</h2>
      <p className="mb-4 text-sm text-slate-600">
        {isDecided
          ? 'Close this application to archive it — it has already been decided.'
          : 'This application has not reached a final decision yet. Closing it now is a force close and requires a reason.'}
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!open ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {isDecided ? 'Close Application' : 'Force Close'}
        </Button>
      ) : (
        <div>
          {!isDecided && (
            <Textarea
              label="Reason for force-closing"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explain why this application is being closed before a decision was reached…"
            />
          )}
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleClose} loading={busy}>
              Confirm {isDecided ? 'Close' : 'Force Close'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
