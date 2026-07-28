'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { formatDateTime, formatFileSize } from '@/lib/format';
import { ApplicationComment } from '@/types';

export default function CommentThread({
  applicationId,
  onAfterPost,
}: {
  applicationId: string;
  onAfterPost?: () => void;
}) {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get(`/applications/${applicationId}/comments`)
      .then((res) => setComments(res.data.data.comments))
      .catch(() => setError('Unable to load comments.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files).slice(0, 3));
  };

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      files.forEach((f) => formData.append('attachments', f));
      await api.post(`/applications/${applicationId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('');
      setFiles([]);
      load();
      onAfterPost?.();
    } catch {
      setError('Failed to post comment.');
    } finally {
      setPosting(false);
    }
  };

  const downloadCommentAttachment = (commentId: string, attachmentId: string) => {
    api
      .get(`/applications/${applicationId}/comments/${commentId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => setError('Failed to download attachment.'));
  };

  return (
    <Card>
      <h2 className="mb-4 font-medium text-slate-900">Comments</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="mb-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">{c.author?.fullName || 'Unknown'}</span>
                <span>{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{c.message}</p>
              {c.attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {c.attachments.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => downloadCommentAttachment(c.id, a.id)}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        📎 {a.fileName} ({formatFileSize(a.size)})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handlePost}>
        <Textarea
          label="Reply to reviewer"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
        />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={posting} disabled={!message.trim()}>
          Post Comment
        </Button>
      </form>
    </Card>
  );
}
