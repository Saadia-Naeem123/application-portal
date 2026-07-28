'use client';

import { useEffect, useState, FormEvent, ChangeEvent, DragEvent, Suspense } from 'react';
import { AxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Input,
  Select,
  Textarea,
  Button,
  ProgressBar,
  Modal,
  Skeleton,
  useToast,
} from '@/components/ui';
import { formatFileSize } from '@/lib/format';
import { Application, ApplicationType, Priority, PRIORITY_LABELS } from '@/types';

function apiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as AxiosError<{ message: string }>;
  return axiosErr.response?.data?.message || fallback;
}

const MAX_DESCRIPTION_HINT = 2000;

function NewApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');
  const { toast } = useToast();

  const [types, setTypes] = useState<ApplicationType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  // Draft created on the server once the student saves — everything past
  // this point (attachments, final submit) needs a real application id.
  const [draft, setDraft] = useState<Application | null>(null);
  const [resuming, setResuming] = useState(!!resumeId);

  const [applicationTypeId, setApplicationTypeId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [touched, setTouched] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    api
      .get('/application-types')
      .then((res) => setTypes(res.data.data.applicationTypes))
      .catch(() => setLoadError('Unable to load application types. Please try again later.'))
      .finally(() => setTypesLoading(false));
  }, []);

  // Resuming an existing draft ("Continue Editing" from the detail page) —
  // load it and seed the form instead of starting from scratch.
  useEffect(() => {
    if (!resumeId) return;
    api
      .get(`/applications/${resumeId}`)
      .then((res) => {
        const app: Application = res.data.data.application;
        if (app.status !== 'DRAFT') {
          setLoadError('This application can no longer be edited — it has already been submitted.');
          return;
        }
        setDraft(app);
        setApplicationTypeId(app.applicationType?.id || '');
        setSubject(app.subject);
        setDescription(app.description);
        setPriority(app.priority);
      })
      .catch(() => setLoadError('Unable to load that draft.'))
      .finally(() => setResuming(false));
  }, [resumeId]);

  const subjectValid = subject.trim().length > 0;
  const descriptionValid = description.trim().length > 0;
  const typeValid = !!applicationTypeId;
  const step = draft ? 2 : 1;

  const saveDraft = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!typeValid || !subjectValid || !descriptionValid) {
      toast({ variant: 'error', title: 'Please complete the required fields before saving.' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/applications', {
        applicationTypeId,
        subject,
        description,
        priority: priority || undefined,
        saveAsDraft: true,
      });
      setDraft(res.data.data.application);
      toast({ variant: 'success', title: 'Draft saved', description: 'Attach documents below, then submit when ready.' });
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to save draft', description: apiErrorMessage(err, '') });
    } finally {
      setSaving(false);
    }
  };

  const updateDraftFields = async () => {
    if (!draft) return;
    try {
      const res = await api.patch(`/applications/${draft.id}`, {
        applicationTypeId,
        subject,
        description,
        priority: priority || undefined,
      });
      setDraft(res.data.data.application);
      toast({ variant: 'success', title: 'Draft updated' });
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to update draft', description: apiErrorMessage(err, '') });
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!draft || !files || (files as FileList).length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    setUploading(true);
    try {
      const res = await api.post(`/applications/${draft.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraft({ ...draft, attachments: [...draft.attachments, ...res.data.data.attachments] });
      toast({ variant: 'success', title: 'Document(s) uploaded' });
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to upload document(s)', description: apiErrorMessage(err, '') });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  const removeAttachment = async (attachmentId: string) => {
    if (!draft) return;
    try {
      await api.delete(`/applications/${draft.id}/attachments/${attachmentId}`);
      setDraft({ ...draft, attachments: draft.attachments.filter((a) => a.id !== attachmentId) });
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to remove document', description: apiErrorMessage(err, '') });
    }
  };

  const handleSubmitApplication = async () => {
    if (!draft) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/applications/${draft.id}/submit`);
      toast({ variant: 'success', title: 'Application submitted' });
      router.push(`/applications/${res.data.data.application.id}`);
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to submit application', description: apiErrorMessage(err, '') });
      setSubmitting(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!draft) return;
    setDiscarding(true);
    try {
      await api.delete(`/applications/${draft.id}`);
      toast({ variant: 'success', title: 'Draft discarded' });
      router.push('/applications');
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to discard draft', description: apiErrorMessage(err, '') });
      setDiscarding(false);
      setShowDiscardModal(false);
    }
  };

  const selectedType = types.find((t) => t.id === applicationTypeId);

  if (resuming) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Breadcrumbs overrides={{ applications: 'Applications', new: draft ? 'Edit Draft' : 'New Application' }} />

        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{draft ? `Draft ${draft.applicationNumber}` : 'New Application'}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {draft
              ? "Attach any supporting documents, then submit when you're ready."
              : 'Fill in the details below and save your application as a draft to continue.'}
          </p>
        </div>

        <ProgressBar
          value={step}
          max={2}
          label={step === 1 ? 'Step 1 of 2 — Application Details' : 'Step 2 of 2 — Documents & Submit'}
          variant={step === 2 ? 'success' : 'primary'}
        />

        {loadError && (
          <Card className="border-error-200 bg-error-50">
            <p className="text-sm text-error-700">{loadError}</p>
          </Card>
        )}

        <Card>
          <form onSubmit={draft ? (e) => e.preventDefault() : saveDraft}>
            <Select
              label="Application Type"
              value={applicationTypeId}
              onChange={(e) => setApplicationTypeId(e.target.value)}
              disabled={!!draft || typesLoading}
              error={touched && !typeValid ? 'Please select an application type.' : undefined}
              required
            >
              <option value="">{typesLoading ? 'Loading…' : 'Select an application type'}</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>

            {selectedType && (
              <p className="-mt-3 mb-4 text-xs text-neutral-500">
                Routed to <strong>{selectedType.department?.name || 'the responsible department'}</strong>
                {selectedType.requiresSupervisorApproval ? ' via your academic supervisor first.' : '.'}
                {' '}Typical turnaround: {selectedType.slaWorkingHours} working hours.
              </p>
            )}

            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your application"
              error={touched && !subjectValid ? 'Subject is required.' : undefined}
              required
            />

            <Textarea
              label="Application Details"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_HINT))}
              placeholder="Describe your request or complaint in detail…"
              error={touched && !descriptionValid ? 'Please describe your request.' : undefined}
              helperText={`${description.length}/${MAX_DESCRIPTION_HINT} characters`}
              required
            />

            <Select label="Priority (optional)" value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')}>
              <option value="">Use application type default</option>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>

            {!draft ? (
              <Button type="submit" loading={saving}>
                Save Draft
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={updateDraftFields}>
                Update Draft Details
              </Button>
            )}
          </form>
        </Card>

        {draft && (
          <>
            <Card>
              <h2 className="mb-1 font-medium text-neutral-900">Supporting Documents</h2>
              <p className="mb-4 text-sm text-neutral-500">
                PDF, Word, JPEG, PNG or WEBP — up to 10MB per file, 5 files per upload.
              </p>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  dragActive ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <UploadCloud className={`h-6 w-6 ${dragActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                <p className="text-sm font-medium text-neutral-700">
                  {uploading ? 'Uploading…' : 'Drag & drop files here, or click to browse'}
                </p>
                <input type="file" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>

              {draft.attachments.length === 0 ? (
                <p className="text-sm text-neutral-500">No documents uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {draft.attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2 text-neutral-700">
                        <FileText className="h-4 w-4 text-neutral-400" />
                        {a.fileName} <span className="text-neutral-400">({formatFileSize(a.size)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        aria-label={`Remove ${a.fileName}`}
                        className="rounded p-1 text-neutral-400 hover:bg-error-50 hover:text-error-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<CheckCircle2 />} onClick={handleSubmitApplication} loading={submitting}>
                Submit Application
              </Button>
              <Button variant="secondary" onClick={() => router.push('/applications')}>
                Save &amp; Finish Later
              </Button>
              <Button variant="danger" onClick={() => setShowDiscardModal(true)}>
                Discard Draft
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard this draft?"
        description="This cannot be undone — the draft and any uploaded documents will be permanently removed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDiscardModal(false)}>
              Keep Draft
            </Button>
            <Button variant="danger" onClick={handleDiscardDraft} loading={discarding}>
              Discard Draft
            </Button>
          </>
        }
      />
    </ProtectedRoute>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <NewApplicationForm />
    </Suspense>
  );
}
