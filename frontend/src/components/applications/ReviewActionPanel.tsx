'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { Application, Supervisor } from '@/types';

type Mode = 'none' | 'reject' | 'revision' | 'forward' | 'return' | 'investigate';

// Whether the signed-in user is the stage reviewer authorized to act on
// this application right now. Covers the Academic Supervisor stage, the
// Department Officer stage (DEPARTMENT, or DEPARTMENT_HEAD for officers
// flagged as their department's head), and the Dean stage — mirrors
// workflow.service.js#resolveUserStage and #assertCanReview on the backend.
// Admins are always authorized as the backend's backstop, so the button is
// shown and the server has the final say either way.
function canReview(
  application: Application,
  user: { id: string; role: string; department?: string | null; isDepartmentHead?: boolean } | null
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return Boolean(application.currentStage);
  if (user.role === 'ACADEMIC_SUPERVISOR') {
    return (
      application.currentStage === 'SUPERVISOR' &&
      application.status === 'UNDER_SUPERVISOR_REVIEW' &&
      (application.supervisor?.id === user.id || application.assignedOfficer?.id === user.id)
    );
  }
  if (user.role === 'DEPARTMENT_OFFICER') {
    if (application.assignedOfficer?.id === user.id) return true;
    const expectedStage = user.isDepartmentHead ? 'DEPARTMENT_HEAD' : 'DEPARTMENT';
    return application.currentStage === expectedStage && application.department?.name === user.department;
  }
  if (user.role === 'DEAN') {
    return application.currentStage === 'DEAN';
  }
  return false;
}

export default function ReviewActionPanel({
  application,
  onUpdated,
}: {
  application: Application;
  onUpdated: (application: Application) => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('none');
  const [remarks, setRemarks] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'forward' && supervisors.length === 0) {
      api
        .get('/users/supervisors')
        .then((res) => setSupervisors(res.data.data.supervisors))
        .catch(() => setError('Unable to load the list of supervisors to forward to.'));
    }
  }, [mode, supervisors.length]);

  if (!canReview(application, user)) return null;

  const isDepartmentOfficer = user?.role === 'DEPARTMENT_OFFICER';
  const isDean = user?.role === 'DEAN' || (user?.role === 'ADMIN' && application.currentStage === 'DEAN');
  const canForward = !isDepartmentOfficer && !isDean;

  const resetForm = () => {
    setMode('none');
    setRemarks('');
    setToUserId('');
    setError('');
  };

  const runAction = async (fn: () => Promise<{ data: { data: { application: Application } } }>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      onUpdated(res.data.data.application);
      resetForm();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = () => runAction(() => api.patch(`/applications/${application.id}/approve`, { remarks: remarks || undefined }));

  const handleReject = () => {
    if (!remarks.trim()) {
      setError('A reason is required to reject an application.');
      return;
    }
    runAction(() => api.patch(`/applications/${application.id}/reject`, { remarks }));
  };

  const handleRequestRevision = () => {
    if (!remarks.trim()) {
      setError('Please specify what needs to be revised.');
      return;
    }
    runAction(() => api.patch(`/applications/${application.id}/request-info`, { remarks }));
  };

  const handleForward = () => {
    if (!toUserId) {
      setError('Please select a supervisor to forward to.');
      return;
    }
    runAction(() => api.patch(`/applications/${application.id}/forward`, { toUserId, remarks: remarks || undefined }));
  };

  const handleReturnToDepartment = () => {
    if (!remarks.trim()) {
      setError('Please explain why this application is being returned to the department.');
      return;
    }
    runAction(() => api.patch(`/applications/${application.id}/return-to-department`, { remarks }));
  };

  const handleRequestInvestigation = () => {
    if (!remarks.trim()) {
      setError('Please specify what needs to be investigated.');
      return;
    }
    runAction(() => api.patch(`/applications/${application.id}/request-investigation`, { remarks }));
  };

  return (
    <Card className="border-brand-200 bg-brand-50/40 print:hidden">
      <h2 className="mb-1 font-medium text-slate-900">Review This Application</h2>
      <p className="mb-4 text-sm text-slate-600">
        {isDean
          ? 'As Dean, you can approve, reject, return this application to the department, or request further investigation before deciding.'
          : isDepartmentOfficer
          ? 'As the Department Officer, you can approve, reject, or request clarification on this application.'
          : 'As the assigned Academic Supervisor, you can approve, reject, request a revision, or forward this application.'}
      </p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {mode === 'none' && isDean && (
        <Textarea
          label="Final remarks (optional, included with your decision)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any closing remarks for the record…"
        />
      )}

      {mode === 'none' && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleApprove} loading={busy}>
            Approve
          </Button>
          <Button variant="secondary" onClick={() => setMode('reject')}>
            Reject
          </Button>
          {isDean ? (
            <>
              <Button variant="secondary" onClick={() => setMode('return')}>
                Return to Department
              </Button>
              <Button variant="secondary" onClick={() => setMode('investigate')}>
                Request Investigation
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setMode('revision')}>
              {isDepartmentOfficer ? 'Request Clarification' : 'Request Revision'}
            </Button>
          )}
          {canForward && (
            <Button variant="secondary" onClick={() => setMode('forward')}>
              Forward
            </Button>
          )}
        </div>
      )}

      {mode === 'reject' && (
        <div>
          <Textarea
            label={isDean ? 'Final remarks / reason for rejection' : 'Reason for rejection'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Explain why this application is being rejected…"
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject} loading={busy}>
              Confirm Rejection
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'revision' && (
        <div>
          <Textarea
            label={isDepartmentOfficer ? 'What needs clarification?' : 'What needs to be revised?'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe the additional information or changes needed…"
          />
          <div className="flex gap-3">
            <Button onClick={handleRequestRevision} loading={busy}>
              {isDepartmentOfficer ? 'Send Clarification Request' : 'Send Revision Request'}
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'return' && (
        <div>
          <Textarea
            label="Why is this being returned to the department?"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Explain what the department should reconsider or decide…"
          />
          <div className="flex gap-3">
            <Button onClick={handleReturnToDepartment} loading={busy}>
              Return to Department
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'investigate' && (
        <div>
          <Textarea
            label="What needs to be investigated?"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe what the department should look into before you decide…"
          />
          <p className="mb-3 text-xs text-slate-500">
            This stays in your queue — the department is notified to investigate, but you&apos;ll still make the final decision.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleRequestInvestigation} loading={busy}>
              Request Investigation
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'forward' && (
        <div>
          <Select label="Forward to" value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="">Select a supervisor…</option>
            {supervisors
              .filter((s) => s.id !== user?.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                  {s.department ? ` (${s.department})` : ''}
                </option>
              ))}
          </Select>
          <Textarea
            label="Note (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add a note for the reviewer you're forwarding to…"
          />
          <div className="flex gap-3">
            <Button onClick={handleForward} loading={busy}>
              Forward
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
