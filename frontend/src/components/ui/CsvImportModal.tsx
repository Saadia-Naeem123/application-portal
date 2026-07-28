'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, X, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { cn } from '@/lib/cn';

export interface CsvColumn {
  /** Key the normalized row is stored under, and the key passed to onImportRow */
  key: string;
  /** Column header shown in the template + matched against the uploaded file's header row */
  label: string;
  required?: boolean;
  /** Shown in the downloadable template's example row */
  example?: string;
}

type RowStatus = 'pending' | 'importing' | 'success' | 'error';

interface RowResult {
  index: number;
  data: Record<string, string>;
  status: RowStatus;
  message?: string;
}

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  columns: CsvColumn[];
  /** Create a single record — reuse exactly the same call the manual "Add" form makes. Throw with a message to mark that row as failed. */
  onImportRow: (row: Record<string, string>) => Promise<void>;
  /** Called after an import batch finishes so the caller can refresh its list */
  onComplete?: () => void;
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function buildTemplateCsv(columns: CsvColumn[]): string {
  const header = columns.map((c) => c.label).join(',');
  const example = columns.map((c) => `"${(c.example || '').replace(/"/g, '""')}"`).join(',');
  return `${header}\n${example}\n`;
}

export default function CsvImportModal({
  open,
  onClose,
  title,
  description,
  columns,
  onImportRow,
  onComplete,
}: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState<RowResult[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setFileName('');
    setParseError('');
    setRows(null);
    setImporting(false);
    setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (importing) return; // don't let the dialog close mid-import
    if (done) onComplete?.();
    reset();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csv = buildTemplateCsv(columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setParseError('');
    setRows(null);
    setDone(false);
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || [];
        const normalizedHeaders = headers.map(normalizeHeader);

        // Match each expected column to whatever header the file actually
        // has (case/spacing-insensitive), so "Full Name", "full_name", and
        // "fullname" all resolve the same way.
        const headerForColumn = new Map<string, string>();
        for (const col of columns) {
          const idx = normalizedHeaders.findIndex(
            (h) => h === normalizeHeader(col.label) || h === normalizeHeader(col.key)
          );
          if (idx !== -1) headerForColumn.set(col.key, headers[idx]);
        }

        const missingRequired = columns.filter((c) => c.required && !headerForColumn.has(c.key));
        if (missingRequired.length > 0) {
          setParseError(
            `Missing required column${missingRequired.length > 1 ? 's' : ''}: ${missingRequired
              .map((c) => c.label)
              .join(', ')}. Check the template for the expected headers.`
          );
          return;
        }

        if (result.data.length === 0) {
          setParseError('No data rows found in this file.');
          return;
        }

        const normalized: RowResult[] = result.data.map((raw, index) => {
          const data: Record<string, string> = {};
          for (const col of columns) {
            const header = headerForColumn.get(col.key);
            data[col.key] = header ? (raw[header] ?? '').toString().trim() : '';
          }
          return { index, data, status: 'pending' };
        });

        // Drop fully-blank trailing rows some spreadsheet exports add.
        const withContent = normalized.filter((r) => Object.values(r.data).some((v) => v));
        if (withContent.length === 0) {
          setParseError('No data rows found in this file.');
          return;
        }

        setRows(withContent);
      },
      error: (err) => {
        setParseError(`Could not read this file: ${err.message}`);
      },
    });
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!rows) return;
    setImporting(true);

    // Sequential, same as adding records one at a time by hand — keeps
    // load on the API predictable and gives an accurate per-row report.
    for (let i = 0; i < rows.length; i++) {
      setRows((prev) => prev && prev.map((r, idx) => (idx === i ? { ...r, status: 'importing' } : r)));
      try {
        await onImportRow(rows[i].data);
        setRows((prev) => prev && prev.map((r, idx) => (idx === i ? { ...r, status: 'success' } : r)));
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to import this row.';
        setRows((prev) => prev && prev.map((r, idx) => (idx === i ? { ...r, status: 'error', message } : r)));
      }
    }

    setImporting(false);
    setDone(true);
  };

  const successCount = rows?.filter((r) => r.status === 'success').length ?? 0;
  const errorCount = rows?.filter((r) => r.status === 'error').length ?? 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
      footer={
        done ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} loading={importing} disabled={!rows || rows.length === 0}>
              {rows ? `Import ${rows.length} record${rows.length === 1 ? '' : 's'}` : 'Import'}
            </Button>
          </>
        )
      }
    >
      <div className="mb-4 flex items-start justify-between gap-4 rounded-lg bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">
          Upload a CSV with one row per record. Column headers just need to roughly match the
          template below — matching ignores case and spacing.
        </p>
        <Button variant="outline" size="sm" leftIcon={<Download />} onClick={handleDownloadTemplate} className="shrink-0">
          Template
        </Button>
      </div>

      {!rows && (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 text-center transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50/30"
        >
          <UploadCloud className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">Click to choose a CSV file, or drag it here</p>
          <p className="text-xs text-neutral-400">{fileName || 'No file selected'}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {parseError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {rows && (
        <div className="mt-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <FileText className="h-4 w-4 text-neutral-400" />
              <span className="font-medium">{fileName}</span>
              <span className="text-neutral-400">· {rows.length} record{rows.length === 1 ? '' : 's'}</span>
            </div>
            {!importing && !done && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800"
              >
                <X className="h-3.5 w-3.5" /> Choose a different file
              </button>
            )}
          </div>

          {done && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
              <Badge variant="success" dot>
                {successCount} imported
              </Badge>
              {errorCount > 0 && (
                <Badge variant="error" dot>
                  {errorCount} failed
                </Badge>
              )}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="w-8 px-3 py-2"></th>
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => (
                  <tr key={r.index} className={cn(r.status === 'error' && 'bg-error-50/50')}>
                    <td className="px-3 py-2 text-xs text-neutral-400">{r.index + 1}</td>
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-neutral-700 whitespace-nowrap">
                        {r.data[c.key] || <span className="text-neutral-300">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {r.status === 'pending' && <span className="text-xs text-neutral-400">Pending</span>}
                      {r.status === 'importing' && (
                        <span className="flex items-center gap-1 text-xs text-primary-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing…
                        </span>
                      )}
                      {r.status === 'success' && (
                        <span className="flex items-center gap-1 text-xs text-success-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </span>
                      )}
                      {r.status === 'error' && (
                        <span className="flex items-center gap-1 text-xs text-error-600" title={r.message}>
                          <XCircle className="h-3.5 w-3.5" /> {r.message || 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
